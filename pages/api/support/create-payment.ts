import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { createClient } from "@libsql/client";
import { assertSameOrigin } from "@/utils/helper";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { getArticlePrice } from "@/lib/posts-meta";
import { securityLogger } from "@/lib/logger";
import {
  applyRateLimit,
  validateArticleSlug,
  validateFiatAmount,
  validateWalletAddress,
  pricesMatch,
  logAuditEvent,
  getClientIP,
  generatePaymentHash,
  getPaymentoApiKey,
} from "@/lib/security/payment-security";

function getBaseUrl(): string {
  // Allow override via env var (useful for development with ngrok/tunnels)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NODE_ENV === "development") return "https://sudo.party"; // Paymento requires HTTPS
  return "https://sudo.party";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip = getClientIP(req);

  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    // Rate limiting
    if (!applyRateLimit(req, res, "create-payment")) return;

    // CSRF protection
    if (!assertSameOrigin(req)) {
      await logAuditEvent({
        eventType: "validation_failed",
        timestamp: Date.now(),
        ip,
        reason: "CSRF origin mismatch",
      });
      return res.status(403).json({ error: "CSRF protection: origin mismatch" });
    }

    const { fiatAmount, fiatCurrency = "USD", addressLower, articleSlug } = req.body || {};

    // Validate wallet address format
    const validatedAddress = validateWalletAddress(addressLower);
    if (!validatedAddress) {
      await logAuditEvent({
        eventType: "validation_failed",
        timestamp: Date.now(),
        ip,
        reason: "Invalid wallet address format",
        metadata: { providedAddress: String(addressLower).substring(0, 20) },
      });
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Session validation - ensure wallet matches authenticated session
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session?.isLoggedIn || !session.identifier) {
      await logAuditEvent({
        eventType: "validation_failed",
        timestamp: Date.now(),
        ip,
        walletAddress: validatedAddress,
        reason: "Not authenticated",
      });
      return res.status(401).json({ error: "Please sign in first" });
    }

    if (session.identifier.toLowerCase() !== validatedAddress) {
      await logAuditEvent({
        eventType: "suspicious_activity",
        timestamp: Date.now(),
        ip,
        walletAddress: validatedAddress,
        reason: "Wallet address mismatch with session",
        metadata: { sessionWallet: session.identifier.substring(0, 10) + "..." },
      });
      return res.status(403).json({ error: "Wallet mismatch with authenticated session" });
    }

    // Determine if this is an article purchase
    const isArticlePurchase = !!articleSlug;
    let validatedSlug: string | null = null;
    let serverPrice: number | null = null;

    if (isArticlePurchase) {
      // Validate article slug format
      validatedSlug = validateArticleSlug(articleSlug);
      if (!validatedSlug) {
        await logAuditEvent({
          eventType: "validation_failed",
          timestamp: Date.now(),
          ip,
          walletAddress: validatedAddress,
          reason: "Invalid article slug format",
          metadata: { providedSlug: String(articleSlug).substring(0, 50) },
        });
        return res.status(400).json({ error: "Invalid article identifier" });
      }

      // Get server-side price (source of truth)
      serverPrice = getArticlePrice(validatedSlug);
      if (serverPrice === null) {
        await logAuditEvent({
          eventType: "validation_failed",
          timestamp: Date.now(),
          ip,
          walletAddress: validatedAddress,
          articleSlug: validatedSlug,
          reason: "Article not available for individual purchase",
        });
        return res.status(400).json({ error: "This article is not available for individual purchase" });
      }

      // Validate submitted amount matches server price (CRITICAL: prevents price manipulation)
      const submittedAmount = validateFiatAmount(fiatAmount, 0.01, 10000);
      if (submittedAmount === null || !pricesMatch(submittedAmount, serverPrice)) {
        await logAuditEvent({
          eventType: "suspicious_activity",
          timestamp: Date.now(),
          ip,
          walletAddress: validatedAddress,
          articleSlug: validatedSlug,
          amount: Number(fiatAmount),
          reason: "Price manipulation attempt",
          metadata: { submittedPrice: fiatAmount, serverPrice },
        });
        return res.status(400).json({
          error: "Price mismatch",
          message: "The article price has changed. Please refresh and try again.",
        });
      }
    } else {
      // For donations, enforce minimum
      const min = Number(process.env.SUPPORT_MIN_USD || 5);
      const validatedAmount = validateFiatAmount(fiatAmount, min, 10000);
      if (validatedAmount === null) {
        return res.status(400).json({ error: `Min amount is $${min}` });
      }
      serverPrice = validatedAmount;
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Ensure default membership id
    const def = await db.execute(`SELECT id FROM membership_types WHERE is_default=1 LIMIT 1`);
    const defaultMembershipId = (def.rows[0]?.id as number | null) ?? null;

    // Resolve/create wallet row (use validated address)
    const existing = await db.execute({
      sql: `SELECT id FROM wallets WHERE address = ?`,
      args: [validatedAddress],
    });
    let walletId = existing.rows[0]?.id as number | undefined;
    if (!walletId) {
      await db.execute({
        sql: `INSERT INTO wallets (address, membership_type_id, created_at, session_epoch)
              VALUES (?, ?, CURRENT_TIMESTAMP, 0)`,
        args: [validatedAddress, defaultMembershipId],
      });
      const reread = await db.execute({
        sql: `SELECT id FROM wallets WHERE address = ?`,
        args: [validatedAddress],
      });
      walletId = reread.rows[0]?.id as number | undefined;
    }
    if (!walletId) return res.status(500).json({ error: "Could not resolve wallet_id" });

    // Generate payment hash for additional verification
    const timestamp = Date.now();
    const paymentHash = isArticlePurchase && validatedSlug
      ? generatePaymentHash(walletId, validatedSlug, serverPrice!, timestamp)
      : null;

    // Opaque orderId (UUID only) — no x:y
    const orderId = randomUUID();
    const ReturnUrl = `${getBaseUrl()}/blog/support/return`;

    // Use server-validated price (never trust client price)
    const finalAmount = serverPrice!;

    // Create Paymento request with validated data
    const r = await fetch("https://api.paymento.io/v1/payment/request", {
      method: "POST",
      headers: {
        "Api-key": getPaymentoApiKey(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fiatAmount: String(finalAmount), // Use server-validated price
        fiatCurrency,
        ReturnUrl,
        orderId, // UUID, gateway-friendly
        Speed: 1,
        additionalData: [
          { key: "kind", value: isArticlePurchase ? "article-purchase" : "support-donation" },
          { key: "wallet_id", value: String(walletId) },
          { key: "address", value: validatedAddress },
          { key: "expected_price", value: String(finalAmount) }, // Store expected price for IPN verification
          ...(validatedSlug ? [{ key: "article_slug", value: validatedSlug }] : []),
          ...(paymentHash ? [{ key: "payment_hash", value: paymentHash }, { key: "hash_timestamp", value: String(timestamp) }] : []),
        ],
      }),
    });

    const text = await r.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      return res
        .status(502)
        .json({ error: "Paymento request failed: non-JSON response", raw: text.slice(0, 200) });
    }

    const token = data?.body;
    if (!r.ok || !token) {
      const msg = data?.message || "Paymento request failed";
      await logAuditEvent({
        eventType: "payment_failed",
        timestamp: Date.now(),
        ip,
        walletAddress: validatedAddress,
        walletId,
        articleSlug: validatedSlug || undefined,
        amount: finalAmount,
        reason: msg,
      });
      return res.status(r.status || 502).json({ error: msg, details: data });
    }

    // Ensure payment_outbox table exists and record the payment initiation
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS payment_outbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          order_id TEXT NOT NULL,
          wallet_id INTEGER NOT NULL,
          article_slug TEXT,
          expected_price REAL,
          payment_hash TEXT,
          hash_timestamp INTEGER,
          created_at INTEGER DEFAULT (strftime('%s','now')),
          FOREIGN KEY (wallet_id) REFERENCES wallets(id)
        )
      `);

      await db.execute({
        sql: `INSERT INTO payment_outbox (token, order_id, wallet_id, article_slug, expected_price, payment_hash, hash_timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(token) DO NOTHING`,
        args: [token, orderId, walletId, validatedSlug, finalAmount, paymentHash, timestamp],
      });
    } catch {
      // Log but don't fail - outbox is defense-in-depth
      securityLogger.error("Failed to record payment outbox");
    }

    // Audit log successful payment initiation
    await logAuditEvent({
      eventType: "payment_initiated",
      timestamp: Date.now(),
      ip,
      walletAddress: validatedAddress,
      walletId,
      articleSlug: validatedSlug || undefined,
      amount: finalAmount,
      token: token.substring(0, 20),
    });

    return res.status(200).json({
      token,
      redirectUrl: `https://app.paymento.io/gateway?token=${token}`,
    });
  } catch (err: any) {
    await logAuditEvent({
      eventType: "payment_failed",
      timestamp: Date.now(),
      ip,
      reason: err?.message || "Internal error",
    });
    return res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
}
