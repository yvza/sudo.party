import { NextApiRequest, NextApiResponse } from "next"
import { getIronSession } from "iron-session"
import {
  defaultSession,
  sessionOptions,
  SessionData,
} from "@/lib/iron-session/config"
import { turso } from "@/lib/turso"

// Only set session.pk when pk is a positive decimal integer
function toSafeInt(val: unknown): number | null {
  if (typeof val === "number" && Number.isSafeInteger(val) && val > 0) return val
  if (typeof val === "string" && /^\d+$/.test(val)) {
    const n = Number(val)
    return Number.isSafeInteger(n) && n > 0 ? n : null
  }
  return null
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (request.method === "POST") {
    // Expect: { pk, identifier, type?, remember?, signedAt? }
    const { pk, identifier, type = "wallet", remember = false, signedAt } = request.body || {}
    if (!pk || !identifier) {
      return response.status(400).json({ error: "pk and identifier are required" })
    }

    const pkVal = String(pk).trim()
    const idVal = String(identifier).trim().toLowerCase()

    // Upsert
    await turso.execute({
      sql: `
        INSERT INTO accounts (pk, identifier, type)
        VALUES (?, ?, ?)
        ON CONFLICT(pk) DO UPDATE SET
          identifier = excluded.identifier,
          type = excluded.type,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [pkVal, idVal, String(type)],
    })

    const { rows } = await turso.execute({
      sql: `SELECT pk, identifier, type FROM accounts WHERE pk = ? LIMIT 1`,
      args: [pkVal],
    })
    const row = rows[0]
    if (!row) return response.status(500).json({ error: "Upsert failed" })

    // numeric pk only if truly an integer
    const pkNum = toSafeInt(row.pk)
    session.pk = pkNum !== null ? pkNum : null

    // REQUIRED: set security metadata
    const now = Date.now()
    session.createdAt   = now
    session.lastActivity= now
    session.remember    = Boolean(remember)
    session.lastSignedAt= typeof signedAt === "number" ? signedAt : now // if you have SIWE verify, pass its timestamp

    // identity fields
    session.identifier = String(row.identifier ?? idVal)
    session.type = String(row.type ?? type)
    session.isLoggedIn = true
    await session.save()
    return response.json(session)
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
