import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { createClient } from "@libsql/client";

function getBaseUrl(): string {
  if (process.env.PAYMENTO_BASE_URL) return process.env.PAYMENTO_BASE_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "https://sudo.party";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { fiatAmount = 5, fiatCurrency = "USD", addressLower } = req.body || {};
    const min = Number(process.env.SUPPORT_MIN_USD || 5);
    if (Number(fiatAmount) < min) {
      return res.status(400).json({ error: `Min amount is $${min}` });
    }
    if (!addressLower || typeof addressLower !== "string") {
      return res.status(400).json({ error: "Connect your wallet first" });
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Ensure default membership id
    const def = await db.execute(`SELECT id FROM membership_types WHERE is_default=1 LIMIT 1`);
    const defaultMembershipId = (def.rows[0]?.id as number | null) ?? null;

    // Resolve/create wallet row
    const existing = await db.execute({
      sql: `SELECT id FROM wallets WHERE address = ?`,
      args: [addressLower],
    });
    let walletId = existing.rows[0]?.id as number | undefined;
    if (!walletId) {
      await db.execute({
        sql: `INSERT INTO wallets (address, membership_type_id, created_at, session_epoch)
              VALUES (?, ?, CURRENT_TIMESTAMP, 0)`,
        args: [addressLower, defaultMembershipId],
      });
      const reread = await db.execute({
        sql: `SELECT id FROM wallets WHERE address = ?`,
        args: [addressLower],
      });
      walletId = reread.rows[0]?.id as number | undefined;
    }
    if (!walletId) return res.status(500).json({ error: "Could not resolve wallet_id" });

    // Opaque orderId (UUID only) — no x:y
    const orderId = randomUUID();
    const ReturnUrl = `${getBaseUrl()}/blog/support/return`;

    // Create Paymento request
    const r = await fetch("https://api.paymento.io/v1/payment/request", {
      method: "POST",
      headers: {
        "Api-key": process.env.PAYMENTO_API_KEY || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fiatAmount: String(fiatAmount),
        fiatCurrency,
        ReturnUrl,
        orderId, // UUID, gateway-friendly
        Speed: 1,
        additionalData: [
          { key: "kind", value: "support-donation" },
          { key: "wallet_id", value: String(walletId) }, // mapping we control
          { key: "address", value: addressLower },
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
      return res.status(r.status || 502).json({ error: msg, details: data });
    }

    // Optional: record the tuple (token, orderId, walletId) for verification hardening.
    // Safe even if the table doesn't exist (wrapped in try/catch).
    try {
      await db.execute({
        sql: `INSERT INTO payment_outbox (token, order_id, wallet_id)
              VALUES (?, ?, ?)
              ON CONFLICT(token) DO NOTHING`,
        args: [token, orderId, walletId],
      });
    } catch {
      // ignore if table not present; core flow doesn't require it
    }

    return res.status(200).json({
      token,
      redirectUrl: `https://app.paymento.io/gateway?token=${token}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
}
