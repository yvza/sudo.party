import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import {
  defaultSession,
  sessionOptions,
  getSessionOptions,
  SessionData,
} from '@/lib/iron-session/config'
import { turso } from '@/lib/turso'

// Simple same-origin check for cookie-auth POSTs
function sameOrigin(req: NextApiRequest) {
  const xfHost = (req.headers['x-forwarded-host'] as string) || ''
  const host = (xfHost || req.headers.host || '').toLowerCase()
  const proto =
    (req.headers['x-forwarded-proto'] as string) ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const expected = `${proto}://${host}`.toLowerCase()
  const origin = (req.headers.origin || '').toLowerCase()
  const referer = (req.headers.referer || '').toLowerCase()
  return (!!origin && origin === expected) || (!!referer && referer.startsWith(expected))
}

// Accept only base-10 integer strings (or numbers) for numeric pk
function parsePkStrict(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw >= 0 ? raw : undefined
  }
  if (typeof raw === 'string') {
    if (!/^[0-9]{1,18}$/.test(raw)) return undefined
    const n = Number(raw)
    return Number.isSafeInteger(n) ? n : undefined
  }
  return undefined
}

function isEthAddress(raw: unknown): raw is string {
  return typeof raw === 'string' && /^0x[a-fA-F0-9]{40}$/.test(raw)
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (request.method === 'POST') {
    // CSRF-ish guard: only same-origin requests for cookie-auth endpoints
    if (!sameOrigin(request)) {
      return response.status(400).json({ error: 'Cross-origin request not allowed' })
    }

    // Identity is established by /api/siwe/verify (session is the source of truth)
    const sessionAddr = (session as any).address as string | undefined
    const sessionPk = (session as any).pk as number | undefined
    const isLoggedIn = (session as any).isLoggedIn === true
    if (!isLoggedIn || !sessionAddr) {
      return response.status(401).json({ error: 'Not authenticated (run /api/siwe/verify first)' })
    }

    // Optional body fields (ignored for identity; validated if present)
    const { identifier, type = 'wallet', remember = false, signedAt, pk: bodyPkRaw } = request.body || {}

    // Address mismatch guard (defense-in-depth)
    const bodyAddr =
      (typeof identifier === 'string' && identifier.trim().toLowerCase()) || undefined
    const sessAddrLower = sessionAddr.toLowerCase()
    if (bodyAddr && bodyAddr !== sessAddrLower) {
      return response.status(400).json({ error: 'Address mismatch with session' })
    }

    // If pk is an ETH address: it must equal the session (or identifier if provided)
    if (isEthAddress(bodyPkRaw)) {
      const pkAddrLower = bodyPkRaw.toLowerCase()
      const refAddrLower = (bodyAddr || sessAddrLower)
      if (pkAddrLower !== refAddrLower) {
        return response.status(400).json({ error: 'pk address mismatch with session' })
      }
    }

    // Canonical identity for DB comes from the session ONLY
    const addr = sessAddrLower

    // Ensure wallet row exists, with default membership if new
    // 1) try find existing
    let rs = await turso.execute({
      sql: `SELECT w.id AS walletId, w.address, COALESCE(mt.slug,'public') AS slug,
                   COALESCE(mt.name,'Public') AS name, COALESCE(mt.rank,1) AS rank,
                   COALESCE(w.session_epoch,0) AS session_epoch
            FROM wallets w
            LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
            WHERE w.address = ? LIMIT 1`,
      args: [addr],
    })

    let walletId: number | null = null
    let membership = { slug: 'public', name: 'Public', rank: 1 as number }

    if (!rs.rows.length) {
      // 2) get default membership
      const def = await turso.execute({
        sql: `SELECT id, slug, name, rank
              FROM membership_types
              WHERE is_default = 1
              LIMIT 1`,
      })
      if (!def.rows.length) {
        return response.status(500).json({ error: 'No default membership configured' })
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
        sql: `SELECT w.id AS walletId, w.address, COALESCE(mt.slug,'public') AS slug,
                     COALESCE(mt.name,'Public') AS name, COALESCE(mt.rank,1) AS rank,
                     COALESCE(w.session_epoch,0) AS session_epoch
              FROM wallets w
              LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
              WHERE w.address = ?
              LIMIT 1`,
        args: [addr],
      })
    }

    // final row
    const row: any = rs.rows[0]
    const epoch = Number(row?.session_epoch ?? 0)
    walletId = Number(row?.walletId)
    if (row?.slug) {
      membership = { slug: row.slug, name: row.name, rank: row.rank ?? 1 }
    }

    // If pk is a DECIMAL integer: enforce against session.pk (when present) and DB walletId
    const bodyPkNum = parsePkStrict(bodyPkRaw)
    if (bodyPkRaw !== undefined && bodyPkNum !== undefined) {
      if (sessionPk !== undefined && bodyPkNum !== sessionPk) {
        return response.status(400).json({ error: 'pk mismatch with session' })
      }
      if (Number.isFinite(walletId) && bodyPkNum !== walletId) {
        return response.status(400).json({ error: 'pk mismatch with wallet' })
      }
    }
    // If pk was provided but is neither a valid ETH address nor a decimal integer → ignore it.

    // Write/refresh session — keep both address and identifier for compatibility
    const now = Date.now()
    ;(session as any).isLoggedIn = true
    ;(session as any).address = addr
    ;(session as any).identifier = addr
    ;(session as any).type = String(type)
    ;(session as any).pk = Number.isFinite(walletId) ? walletId : null
    ;(session as any).membership = membership.slug as any
    ;(session as any).rank = membership.rank as any
    ;(session as any).createdAt = now
    ;(session as any).lastActivity = now
    ;(session as any).remember = Boolean(remember)
    ;(session as any).lastSignedAt = typeof signedAt === 'number' ? signedAt : now
    ;(session as any).sessionEpoch = epoch
    await session.save()

    return response.json({
      isLoggedIn: true,
      address: addr,
      membership: membership.slug,
      rank: membership.rank,
      pk: (session as any).pk,
    })
  }

  if (request.method === 'GET') {
    if ((session as any).isLoggedIn !== true) {
      return response.json(defaultSession)
    }
    return response.json(session)
  }

  if (request.method === 'DELETE') {
    // If we know the wallet, bump epoch to revoke old cookies
    const addressLower = String((session as any).identifier || (session as any).address || '').toLowerCase()
    if (addressLower) {
      await turso.execute({
        sql: `UPDATE wallets
              SET session_epoch = COALESCE(session_epoch, 0) + 1
              WHERE address = ?`,
        args: [addressLower],
      })
    }
    await session.destroy()
    return response.json(defaultSession)
  }

  return response.status(405).json({ error: 'Method not allowed' })
}
