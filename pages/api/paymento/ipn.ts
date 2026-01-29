import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@libsql/client";
import { getArticlePrice } from "@/lib/posts-meta";
import {
  getClientIP,
  verifyPaymentoHmac,
  getHmacSignature,
  validateArticleSlug,
  pricesMatch,
  logAuditEvent,
  getPaymentoApiKey,
} from "@/lib/security/payment-security";

const PAID = 7;
const APPROVED = 8;

// Disable body parsing to get raw body for HMAC verification
export const config = {
  api: {
    bodyParser: false,
  },
};

function expiryEpochMonths(months: number, baseSeconds?: number): number | null {
  if (!months || months <= 0) return null; // lifetime
  const base = baseSeconds && baseSeconds > 0 ? baseSeconds : Math.floor(Date.now() / 1000);
  return base + months * 30 * 24 * 3600; // ~30-day months
}

// Helper to read raw body
async function getRawBody(req: NextApiRequest): Promise<{ raw: string; parsed: any }> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve({ raw: data, parsed });
      } catch {
        resolve({ raw: data, parsed: {} });
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIP(req);

  // Paymento will call this from their servers
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Get raw body for HMAC verification
    const { raw: rawBody, parsed: body } = await getRawBody(req);

    // HMAC Signature Verification (Paymento's recommended approach)
    const hmacSignature = getHmacSignature(req);
    const hmacResult = verifyPaymentoHmac(rawBody, hmacSignature);

    if (!hmacResult.valid) {
      await logAuditEvent({
        eventType: "hmac_verification_failed",
        timestamp: Date.now(),
        ip,
        reason: hmacResult.reason || "HMAC verification failed",
        metadata: { hasSignature: !!hmacSignature },
      });
      // Still return 200 to prevent retry storms, but don't process
      return res.status(200).json({ ok: false, reason: "hmac_verification_failed" });
    }

    // Accept JSON body; must include token
    const token =
      (body?.token as string | undefined) ||
      (body?.Token as string | undefined) ||
      (body?.body?.token as string | undefined);

    if (!token || typeof token !== "string" || token.length > 500) {
      return res.status(200).json({ ok: false, reason: "missing_token" });
    }

    // 1) Verify with Paymento (source of truth)
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
      return res.status(200).json({ ok: false, reason: "verify_non_json" });
    }
    if (!vr.ok || !verify?.success || !verify?.body) {
      return res.status(200).json({ ok: false, reason: "verify_failed" });
    }

    const b = verify.body;
    const status: number = Number(b.orderStatus ?? b.OrderStatus ?? 0);
    const verifiedToken: string | undefined = b.token || b.Token;
    const orderId: string | null = b.orderId || b.OrderId || null; // opaque UUID
    const additional: Array<{ key: string; value: string }> = b.additionalData || [];
    const paymentId: number | null = b.paymentId ?? b.PaymentId ?? null;

    // Token echo must match
    if (!verifiedToken || verifiedToken !== token) {
      return res.status(200).json({ ok: false, reason: "token_mismatch" });
    }
    // Only handle paid/approved
    if (!(status === PAID || status === APPROVED)) {
      return res.status(200).json({ ok: false, reason: "not_completed", status });
    }

    const db = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN });

    // (Optional) Outbox validation: ensure orderId matches what we generated
    let expectedWalletId: number | null = null;
    let expectedOrderId: string | null = null;
    try {
      const out = await db.execute({
        sql: `SELECT wallet_id, order_id FROM payment_outbox WHERE token = ? LIMIT 1`,
        args: [token],
      });
      if (out.rows.length) {
        expectedWalletId = (out.rows[0].wallet_id as number) ?? null;
        expectedOrderId = (out.rows[0].order_id as string) ?? null;
      }
    } catch {
      // ignore if table doesn't exist
    }
    if (expectedOrderId && orderId && expectedOrderId !== orderId) {
      return res.status(200).json({ ok: false, reason: "order_mismatch" });
    }

    // Resolve wallet_id (prefer additionalData; then outbox; then address)
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
      return res.status(200).json({ ok: false, reason: "wallet_not_found" });
    }

    // Upsert payment record (idempotent by token)
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
    const expectedPriceFromOutbox = additional.find(a => a.key === "expected_price")?.value;

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
          reason: "Invalid article slug in IPN",
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
          reason: "Article not purchasable - possible slug injection",
        });
        return res.status(200).json({ ok: false, reason: "article_not_purchasable" });
      }

      // SECURITY: Verify paid amount matches expected price (prevents price manipulation)
      if (!pricesMatch(fiatAmount, serverPrice)) {
        await logAuditEvent({
          eventType: "suspicious_activity",
          timestamp: Date.now(),
          ip,
          walletId,
          articleSlug: validatedSlug,
          amount: fiatAmount,
          token: token.substring(0, 20),
          reason: "Price mismatch in IPN - possible manipulation",
          metadata: { paidAmount: fiatAmount, expectedPrice: serverPrice },
        });
        return res.status(200).json({ ok: false, reason: "price_mismatch" });
      }

      // Additional check: verify against outbox expected price if available
      if (expectedPriceFromOutbox) {
        const outboxPrice = Number(expectedPriceFromOutbox);
        if (!pricesMatch(fiatAmount, outboxPrice)) {
          await logAuditEvent({
            eventType: "suspicious_activity",
            timestamp: Date.now(),
            ip,
            walletId,
            articleSlug: validatedSlug,
            amount: fiatAmount,
            token: token.substring(0, 20),
            reason: "Price mismatch with outbox record",
            metadata: { paidAmount: fiatAmount, outboxPrice },
          });
          return res.status(200).json({ ok: false, reason: "outbox_price_mismatch" });
        }
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
      // Use serverPrice (canonical) instead of fiatAmount for consistency
      await db.execute({
        sql: `INSERT INTO article_purchases (wallet_id, article_slug, payment_token, price_usd)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(wallet_id, article_slug) DO NOTHING`,
        args: [walletId, validatedSlug, token, serverPrice],
      });

      // Log successful purchase
      await logAuditEvent({
        eventType: "purchase_granted",
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

      return res.status(200).json({ ok: true });
    }

    // Ensure supporter tier exists (for support donations)
    await db.execute({
      sql: `INSERT INTO membership_types (slug, name, rank, is_default)
            SELECT 'supporter','Supporter',2,0
            WHERE NOT EXISTS (SELECT 1 FROM membership_types WHERE slug='supporter')`,
    });

    // Decide if wallet should be upgraded (Public -> Supporter only)
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

    // Compute expiry ONLY for upgrade (public -> supporter)
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

    // History (idempotent)
    await db.execute({
      sql: `INSERT INTO supporter_grants (wallet_id, payment_token, starts_at, expires_at, source)
            VALUES (?, ?, strftime('%s','now'), ?, 'paymento')
            ON CONFLICT(wallet_id, payment_token) DO NOTHING`,
      args: [walletId, token, newExpiry],
    });

    // Upgrade only if current rank < supporter
    if (currentRank < supporterRank && supporterTypeId) {
      await db.execute({
        sql: `UPDATE wallets
                SET membership_type_id = ?,
                    membership_expires_at = ?
              WHERE id = ?`,
        args: [supporterTypeId, newExpiry, walletId],
      });
    }

    // Optionally clear outbox
    try {
      await db.execute({ sql: `DELETE FROM payment_outbox WHERE token = ?`, args: [token] });
    } catch {
      // ignore if not present
    }

    // Respond 200 so Paymento stops retrying
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    // Log full error server-side for debugging, but don't expose to client
    console.error("[payment-ipn] Internal error:", e?.message, e?.stack);
    // Still return 200 with ok:false so gateway doesn't hammer retries forever
    return res.status(200).json({ ok: false, reason: "internal_error" });
  }
}
