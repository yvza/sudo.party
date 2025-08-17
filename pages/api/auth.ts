import { NextApiRequest, NextApiResponse } from "next"
import { getIronSession } from "iron-session"
import {
  defaultSession,
  sessionOptions,
  SessionData,
} from "@/lib/iron-session/config"
import { turso } from "@/lib/turso"

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (request.method === "POST") {
    // Expect body: { identifier: string, type?: string, remember?: boolean, signedAt?: number }
    const { identifier, type = "wallet", remember = false, signedAt } = request.body || {}
    const addr = String(identifier ?? "").trim().toLowerCase()
    if (!addr) {
      return response.status(400).json({ error: "identifier (wallet address) is required" })
    }

    // Ensure wallet row exists, with default membership if new
    // 1) try find existing
    let rs = await turso.execute({
      sql: `SELECT w.id AS walletId, w.address, mt.slug, mt.name, mt.rank
            FROM wallets w
            LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
            WHERE w.address = ?`,
      args: [addr],
    })

    let walletId: number | null = null
    let membership = { slug: "public", name: "Public", rank: 1 as number }

    if (!rs.rows.length) {
      // 2) get default membership
      const def = await turso.execute({
        sql: `SELECT id, slug, name, rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
      })
      if (!def.rows.length) {
        return response.status(500).json({ error: "No default membership configured" })
      }
      const defId = Number(def.rows[0].id)

      // 3) insert wallet (race-safe)
      await turso.execute({
        sql: `INSERT INTO wallets (address, membership_type_id)
              VALUES (?, ?)
              ON CONFLICT(address) DO NOTHING`,
        args: [addr, defId],
      })

      // 4) re-select after upsert
      rs = await turso.execute({
        sql: `SELECT w.id AS walletId, w.address, mt.slug, mt.name, mt.rank
              FROM wallets w
              LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
              WHERE w.address = ?`,
        args: [addr],
      })
    }

    // final row
    const row: any = rs.rows[0]
    walletId = Number(row.walletId)
    if (row.slug) {
      membership = { slug: row.slug, name: row.name, rank: row.rank ?? 1 }
    }

    // write session
    const now = Date.now()
    session.isLoggedIn = true
    session.identifier = addr
    session.type = String(type)
    session.pk = Number.isFinite(walletId) ? walletId : null
    session.membership = membership.slug as any
    session.rank = membership.rank as any
    session.createdAt = now
    session.lastActivity = now
    session.remember = Boolean(remember)
    session.lastSignedAt = typeof signedAt === "number" ? signedAt : now
    await session.save()

    // return a concise payload (you can also return session if you prefer)
    return response.json({
      isLoggedIn: true,
      address: addr,
      membership: membership.slug,
      rank: membership.rank,
      pk: session.pk,
    })
  }

  if (request.method === "GET") {
    if (session.isLoggedIn !== true) {
      return response.json(defaultSession)
    }
    return response.json(session)
  }

  if (request.method === "DELETE") {
    await session.destroy()
    return response.json(defaultSession)
  }

  return response.status(405).json({ error: "Method not allowed" })
}
