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
    // Expect body like: { pk: string, identifier: string, type?: string }
    // pk can be your wallet address lowercased
    const { pk, identifier, type = "wallet" } = request.body || {}
    if (!pk || !identifier) {
      return response.status(400).json({ error: "pk and identifier are required" })
    }

    // Upsert into Turso
    await turso.execute({
      sql: `
        INSERT INTO accounts (pk, identifier, type)
        VALUES (?, ?, ?)
        ON CONFLICT(pk) DO UPDATE SET
          identifier = excluded.identifier,
          type = excluded.type,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [pk, identifier, type],
    })

    // Optionally read back (or trust inputs)
    const { rows } = await turso.execute({
      sql: `SELECT pk, identifier, type FROM accounts WHERE pk = ? LIMIT 1`,
      args: [pk],
    })
    const row = rows[0]
    if (!row) return response.status(500).json({ error: "Upsert failed" })

    session.pk = String(row.pk)
    session.identifier = String(row.identifier)
    session.type = String(row.type)
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
    session.destroy()
    return response.json(defaultSession)
  }

  return response.status(405).json({ error: "Method not allowed" })
}