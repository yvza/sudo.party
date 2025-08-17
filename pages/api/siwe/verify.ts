import type { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/iron-session/config'
import { SiweMessage } from 'siwe'
import { turso } from '@/lib/turso'
import { getExpectedSiweDomain } from '@/lib/siwe/domain'

function isSameOrigin(req: NextApiRequest) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const host = req.headers.host;
  try {
    const u = new URL(origin);
    return u.host === host;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  // CSRF guard for state-changing auth
  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { message, signature, remember, signedAt } = req.body || {}
  if (typeof message !== 'string' || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing message or signature' })
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  if (!session.nonce) {
    return res.status(400).json({ error: 'Missing nonce in session' })
  }

  // Enforce domain binding
  const expectedDomain = getExpectedSiweDomain(req)
  if (!expectedDomain) {
    return res.status(400).json({ error: 'Unable to determine request host' })
  }

  // Verify SIWE
  const siwe = new SiweMessage(message)
  try {
    const result = await siwe.verify({
      signature,
      domain: expectedDomain,
      nonce: session.nonce,
    })
    if (!result.success) {
      return res.status(401).json({ error: 'Invalid SIWE message/signature' })
    }
  } catch {
    return res.status(401).json({ error: 'Invalid SIWE message/signature' })
  }

  const address = siwe.address.toLowerCase()

  // Upsert wallet and ensure default membership
  await turso.execute({
    sql: `INSERT INTO wallets(address) VALUES(?) ON CONFLICT(address) DO NOTHING`,
    args: [address],
  })
  await turso.execute({
    sql: `
      UPDATE wallets SET membership_type_id = COALESCE(
        membership_type_id,
        (SELECT id FROM membership_types WHERE is_default=1 LIMIT 1)
      )
      WHERE address = ?
    `,
    args: [address],
  })

  // Read back wallet id + membership + rank
  const { rows } = await turso.execute({
    sql: `
      SELECT w.id, w.address,
             COALESCE(mt.slug,'public') AS slug,
             COALESCE(mt.rank,1) AS rank
      FROM wallets w
      LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
      WHERE w.address = ? LIMIT 1
    `,
    args: [address],
  })

  const row = rows[0] as any
  const walletId = Number(row?.id) || null
  const membership = (row?.slug ?? 'public') as SessionData['membership']
  const rank = Number(row?.rank ?? 1)

  // Persist login in iron-session (HTTP-only cookie) + security metadata
  const now = Date.now()
  session.isLoggedIn   = true
  session.identifier   = address          // wallet address
  session.pk           = walletId         // numeric wallets.id
  session.type         = 'wallet'
  session.membership   = membership
  session.rank         = rank
  session.nonce        = undefined        // clear one-time nonce

  // NEW: set TTL & freshness metadata here too
  session.createdAt    = session.createdAt || now
  session.lastActivity = now
  session.remember     = Boolean(remember)          // from client checkbox
  session.lastSignedAt = typeof signedAt === 'number' ? signedAt : now

  await session.save()

  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    isLoggedIn: true,
    address,
    membership,
    rank,
    pk: walletId,
  })
}
