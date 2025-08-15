import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/iron-session/config'
import { turso } from '@/lib/turso'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  // Default payload
  let payload = {
    isLoggedIn: false,
    address: null as string | null,
    membership: 'public' as 'public' | 'sgbcode' | 'sudopartypass',
    rank: 1,
    pk: null as number | null,
  }

  if (session?.isLoggedIn && session.identifier) {
    const address = session.identifier.toLowerCase()

    // Backward compat: if pk is missing or not numeric, look it up and fix
    if (typeof session.pk !== 'number' || !Number.isFinite(session.pk)) {
      const w = await turso.execute({
        sql: `SELECT id FROM wallets WHERE address = ? LIMIT 1`,
        args: [address],
      })
      const walletId = Number(w.rows[0]?.id) || null
      session.pk = walletId
      await session.save().catch(() => {}) // best effort; don’t fail response
    }

    const { rows } = await turso.execute({
      sql: `
        SELECT COALESCE(mt.slug,'public') AS slug, COALESCE(mt.rank,1) AS rank
        FROM wallets w
        LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
        WHERE w.address = ? LIMIT 1
      `,
      args: [address],
    })
    const row = rows[0] as any

    payload = {
      isLoggedIn: true,
      address,
      membership: (row?.slug ?? 'public') as any,
      rank: Number(row?.rank ?? 1),
      pk: session.pk ?? null, // numeric wallet id
    }
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json(payload)
}