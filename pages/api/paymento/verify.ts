import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@libsql/client";
import { getArticlePrice } from "@/lib/posts-meta";
import {
  getClientIP,
  applyRateLimit,
  validateArticleSlug,
  pricesMatch,
  logAuditEvent,
  getPaymentoApiKey,
} from "@/lib/security/payment-security";

const PAID = 7;
const APPROVED = 8;

function expiryEpochMonths(months: number, baseSeconds?: number): number | null {
  if (!months || months <= 0) return null; // lifetime
  const base = baseSeconds && baseSeconds > 0 ? baseSeconds : Math.floor(Date.now() / 1000);
  return base + months * 30 * 24 * 3600; // ~30d months
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIP(req);

  // Best practice: return 200 with ok:false for non-POST too (avoid probes inferring behavior)
  if (req.method !== "POST") {
    return res.status(200).json({ ok: false, message: "Method not allowed", reason: "method_not_allowed" });
  }

  // Rate limiting - prevent brute force token guessing
  if (!applyRateLimit(req, res, "verify-payment")) return;

  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string" || token.length > 500) {
      return res.status(200).json({ ok: false, message: "Missing token", reason: "missing_token" });
    }

    // 1) Verify with Paymento (source of truth; never trust client URL fields)
    const vr = await fetch("https://api.paymento.io/v1/payment/verify", {
      method: "POST",
      headers: {
        "Api-key": getPaymentoApiKey(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const vtext = await vr.text();
    let verify: any;
    try {
      verify = JSON.parse(vtext);
    } catch {
      await logAuditEvent({
        eventType: "payment_failed",
        timestamp: Date.now(),
        ip,
        token: token.substring(0, 20),
        reason: "verify_non_json",
      });
      return res.status(200).json({ ok: false, message: "Payment verification failed.", reason: "verify_non_json" });
    }

    if (!vr.ok || !verify?.success || !verify?.body) {
      await logAuditEvent({
        eventType: "payment_failed",
        timestamp: Date.now(),
        ip,
        token: token.substring(0, 20),
        reason: verify?.message || "verify_failed",
      });
      return res.status(200).json({
        ok: false,
        message: "Payment verification failed.",
        reason: verify?.message || "verify_failed",
      });
    }

    const b = verify.body;
    const status: number = Number(b.orderStatus ?? b.OrderStatus ?? 0);
    const verifiedToken: string | undefined = b.token || b.Token;
    const orderId: string | null = b.orderId || b.OrderId || null; // opaque UUID from gateway
    const additional: Array<{ key: string; value: string }> = b.additionalData || [];
    const paymentId: number | null = b.paymentId ?? b.PaymentId ?? null;

    if (!verifiedToken || verifiedToken !== token) {
      await logAuditEvent({
        eventType: "suspicious_activity",
        timestamp: Date.now(),
        ip,
        token: token.substring(0, 20),
        reason: "token_mismatch",
      });
      return res.status(200).json({ ok: false, message: "Payment verification failed.", reason: "token_mismatch" });
    }

    if (!(status === PAID || status === APPROVED)) {
      return res.status(200).json({ ok: false, message: "Payment not completed yet.", reason: "not_completed", status });
    }

    const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

    // 2) (Optional) payment_outbox check (if table exists)
    let expectedWalletId: number | null = null;
    let expectedOrderId: string | null = null;
    let expectedPrice: number | null = null;
    try {
      const out = await db.execute({
        sql: `SELECT wallet_id, order_id, expected_price FROM payment_outbox WHERE token = ? LIMIT 1`,
        args: [token],
      });
      if (out.rows.length) {
        expectedWalletId = (out.rows[0].wallet_id as number) ?? null;
        expectedOrderId = (out.rows[0].order_id as string) ?? null;
        expectedPrice = (out.rows[0].expected_price as number) ?? null;
      }
    } catch {
      // table may not exist; ignore
    }
    if (expectedOrderId && orderId && expectedOrderId !== orderId) {
      await logAuditEvent({
        eventType: "suspicious_activity",
        timestamp: Date.now(),
        ip,
        token: token.substring(0, 20),
        reason: "order_mismatch",
      });
      return res.status(200).json({ ok: false, message: "Payment verification failed.", reason: "order_mismatch" });
    }

    // 3) Resolve wallet_id (prefer additionalData; then outbox; then address)
    let walletId: number | null = null;

    const wFromAdd = additional.find(a => a.key === "wallet_id")?.value;
    if (wFromAdd && /^\d+$/.test(wFromAdd)) walletId = Number(wFromAdd);

    if (!walletId && expectedWalletId) walletId = expectedWalletId;

    if (!walletId) {
      const addr = additional.find(a => a.key === "address")?.value?.toLowerCase();
      if (addr) {
        const wr = await db.execute({ sql: `SELECT id FROM wallets WHERE address = ?`, args: [addr] });
        walletId = (wr.rows[0]?.id as number) ?? null;
      }
    }

    if (!walletId) {
      return res.status(200).json({ ok: false, message: "Could not map wallet for this payment.", reason: "wallet_not_found" });
    }

    // 4) Persist payment (idempotent by token)
    const orderIdToStore = orderId ?? expectedOrderId ?? null;
    const fiatAmount = Number(b.fiatAmount ?? b.FiatAmount ?? 0);
    await db.execute({
      sql: `INSERT INTO payments (token, order_id, payment_id, status_code, status_text, raw_payload, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, strftime('%s','now'))
            ON CONFLICT(token) DO UPDATE SET
              order_id=excluded.order_id,
              payment_id=excluded.payment_id,
              status_code=excluded.status_code,
              status_text=excluded.status_text,
              raw_payload=excluded.raw_payload,
              updated_at=excluded.updated_at`,
      args: [token, orderIdToStore, paymentId, status, String(status), JSON.stringify(b)],
    });

    // Check payment kind from additionalData
    const kind = additional.find(a => a.key === "kind")?.value;
    const articleSlugRaw = additional.find(a => a.key === "article_slug")?.value;

    // Handle article purchases separately (permanent access, no membership upgrade)
    if (kind === "article-purchase" && articleSlugRaw) {
      // SECURITY: Validate article slug format
      const validatedSlug = validateArticleSlug(articleSlugRaw);
      if (!validatedSlug) {
        await logAuditEvent({
          eventType: "suspicious_activity",
          timestamp: Date.now(),
          ip,
          walletId,
          token: token.substring(0, 20),
          reason: "Invalid article slug in verify",
          metadata: { providedSlug: String(articleSlugRaw).substring(0, 50) },
        });
        return res.status(200).json({ ok: false, reason: "invalid_article_slug" });
      }

      // SECURITY: Verify article exists and get server-side price
      const serverPrice = getArticlePrice(validatedSlug);
      if (serverPrice === null) {
        await logAuditEvent({
          eventType: "suspicious_activity",
          timestamp: Date.now(),
          ip,
          walletId,
          articleSlug: validatedSlug,
          token: token.substring(0, 20),
          reason: "Article not purchasable in verify",
        });
        return res.status(200).json({ ok: false, reason: "article_not_purchasable" });
      }

      // SECURITY: Verify paid amount matches expected price
      if (!pricesMatch(fiatAmount, serverPrice)) {
        await logAuditEvent({
          eventType: "suspicious_activity",
          timestamp: Date.now(),
          ip,
          walletId,
          articleSlug: validatedSlug,
          amount: fiatAmount,
          token: token.substring(0, 20),
          reason: "Price mismatch in verify",
          metadata: { paidAmount: fiatAmount, expectedPrice: serverPrice },
        });
        return res.status(200).json({ ok: false, reason: "price_mismatch" });
      }

      // Create article_purchases table if it doesn't exist
      try {
        await db.execute({
          sql: `CREATE TABLE IF NOT EXISTS article_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_id INTEGER NOT NULL,
            article_slug TEXT NOT NULL,
            payment_token TEXT NOT NULL,
            price_usd REAL NOT NULL,
            purchased_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(wallet_id, article_slug),
            FOREIGN KEY (wallet_id) REFERENCES wallets(id)
          )`,
        });
      } catch {}

      // Insert article purchase (idempotent by wallet_id + article_slug)
      await db.execute({
        sql: `INSERT INTO article_purchases (wallet_id, article_slug, payment_token, price_usd)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(wallet_id, article_slug) DO NOTHING`,
        args: [walletId, validatedSlug, token, fiatAmount],
      });

      // Log successful verification
      await logAuditEvent({
        eventType: "payment_verified",
        timestamp: Date.now(),
        ip,
        walletId,
        articleSlug: validatedSlug,
        amount: fiatAmount,
        token: token.substring(0, 20),
      });

      // Clear outbox
      try {
        await db.execute({ sql: `DELETE FROM payment_outbox WHERE token = ?`, args: [token] });
      } catch {}

      return res.status(200).json({ ok: true, message: "Article purchase verified and processed." });
    }

    // 5) Ensure supporter tier exists (for support donations)
    await db.execute({
      sql: `INSERT INTO membership_types (slug, name, rank, is_default)
            SELECT 'supporter','Supporter',2,0
            WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE slug='supporter')`,
    });

    // 6) Upgrade only if current rank < supporter (Public → Supporter)
    const ranks = await db.execute({
      sql: `
        SELECT
          w.membership_type_id AS current_type_id,
          (SELECT rank FROM membership_types WHERE id = w.membership_type_id) AS current_rank,
          (SELECT id FROM membership_types WHERE slug='supporter') AS supporter_type_id,
          (SELECT rank FROM membership_types WHERE slug='supporter') AS supporter_rank
        FROM wallets w
        WHERE w.id = ?`,
      args: [walletId],
    });

    const row = ranks.rows[0] || {};
    const currentRank = Number(row.current_rank ?? 0) || 0;
    const supporterRank = Number(row.supporter_rank ?? 2) || 2;
    const supporterTypeId = Number(row.supporter_type_id);

    // Compute expiry ONLY when upgrading to supporter (never downgrade OG/private)
    const months = Number(process.env.SUPPORTER_MONTHS || "0");
    let newExpiry: number | null = null;
    if (currentRank < supporterRank && months > 0) {
      const cur = await db.execute({
        sql: `SELECT membership_expires_at FROM wallets WHERE id = ?`,
        args: [walletId],
      });
      const currentExp = Number(cur.rows[0]?.membership_expires_at) || 0;
      const base = Math.max(currentExp, Math.floor(Date.now() / 1000));
      newExpiry = expiryEpochMonths(months, base);
    }

    // 7) Donation history (idempotent per (wallet_id, token))
    await db.execute({
      sql: `INSERT INTO supporter_grants (wallet_id, payment_token, starts_at, expires_at, source)
            VALUES (?, ?, strftime('%s','now'), ?, 'paymento')
            ON CONFLICT(wallet_id, payment_token) DO NOTHING`,
      args: [walletId, token, newExpiry],
    });

    // 8) Apply membership change only for Public->Supporter
    if (currentRank < supporterRank && supporterTypeId) {
      await db.execute({
        sql: `UPDATE wallets
                SET membership_type_id = ?,
                    membership_expires_at = ?
              WHERE id = ?`,
        args: [supporterTypeId, newExpiry, walletId],
      });
    }

    // 9) (Optional) Clear outbox row
    try {
      await db.execute({ sql: `DELETE FROM payment_outbox WHERE token = ?`, args: [token] });
    } catch {}

    return res.status(200).json({ ok: true, message: "Payment verified and processed." });
  } catch (e: any) {
    return res.status(200).json({
      ok: false,
      message: "Internal error while verifying payment.",
      reason: e?.message || "exception",
    });
  }
}
