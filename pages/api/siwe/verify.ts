// pages/api/siwe/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'
import { getIronSession } from 'iron-session'
import { kv } from '@vercel/kv'
import { sessionOptions } from '@/lib/iron-session/config'

// Policy knobs
// Default: prod → [1] (Mainnet); dev/preview → [1, 11155111] (Mainnet + Sepolia)
const ALLOWED_CHAIN_IDS = (
  process.env.SIWE_ALLOWED_CHAINS ??
  (process.env.NODE_ENV === 'production' ? '1' : '1,11155111')
)
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n))

const MAX_ISSUED_AT_AGE_MS = 5 * 60 * 1000 // 5 minutes
const NONCE_TTL_SEC = 10 * 60              // mark nonce used for 10 minutes

// Optional: lock prod to a single domain (e.g. "sudo.party")
const PROD_DOMAIN = (process.env.SIWE_DOMAIN || '').toLowerCase()

function getExpectedHost(req: NextApiRequest) {
  // Prefer proxy headers when present (Vercel/other proxies), fallback to Host
  const xfHost = (req.headers['x-forwarded-host'] as string) || ''
  const host = (xfHost || req.headers.host || '').toLowerCase()
  return host // e.g., "localhost:3000" or "app.example.com"
}

function getExpectedOrigin(req: NextApiRequest) {
  const proto =
    (req.headers['x-forwarded-proto'] as string) ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = getExpectedHost(req)
  return `${proto}://${host}` // e.g., "http://localhost:3000"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  if (!process.env.IRON_SESSION_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfigured: IRON_SESSION_PASSWORD missing' })
  }

  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'Expected application/json' })
  }

  let message: string | Record<string, any>
  let signature: string
  try {
    ({ message, signature } = req.body || {})
    if (!message || !signature) {
      return res.status(400).json({ error: 'Missing message or signature' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  // Load session to fetch server-issued nonce (from /api/siwe/nonce)
  const session = await getIronSession(req, res, sessionOptions as any)
  const serverNonce = (session as any).nonce as string | undefined
  if (!serverNonce) {
    return res.status(400).json({ error: 'Nonce missing or expired. Call /api/siwe/nonce first.' })
  }

  // Block immediate replays even before verifying signature
  const nonceReuseKey = `siwe:nonce:used:${serverNonce}`
  const alreadyUsed = await kv.get(nonceReuseKey)
  if (alreadyUsed) {
    return res.status(409).json({ error: 'Nonce already used' })
  }

  // Parse SIWE (supports string or object)
  let siwe: SiweMessage
  try {
    siwe = new SiweMessage(message)
  } catch {
    return res.status(400).json({ error: 'Invalid SIWE message' })
  }

  // ── 1) Pre-verification policy checks
  // Chain allowlist
  if (!ALLOWED_CHAIN_IDS.includes(Number(siwe.chainId))) {
    return res.status(400).json({ error: `Unsupported chainId ${siwe.chainId}` })
  }

  // issuedAt freshness
  if (!siwe.issuedAt) {
    return res.status(400).json({ error: 'issuedAt missing in SIWE message' })
  }
  const issuedAtMs = Date.parse(siwe.issuedAt)
  if (!Number.isFinite(issuedAtMs)) {
    return res.status(400).json({ error: 'issuedAt is invalid' })
  }
  const now = Date.now()
  if (Math.abs(now - issuedAtMs) > MAX_ISSUED_AT_AGE_MS) {
    return res.status(400).json({ error: 'Message too old or from the future' })
  }

  // Domain + URI checks (dev-friendly with/without port; strict origin equality)
  const expectedHost = getExpectedHost(req)                  // e.g., "localhost:3000"
  const expectedHostname = expectedHost.split(':')[0]        // "localhost"
  const domainLower = (siwe.domain || '').toLowerCase()

  const domainOk =
    domainLower === expectedHost ||
    domainLower === expectedHostname

  const expectedOrigin = getExpectedOrigin(req).toLowerCase().replace(/\/$/, '')
  const siweOrigin = (siwe.uri || '').toLowerCase().replace(/\/$/, '')
  const uriOk = siweOrigin === expectedOrigin

  if (!domainOk || !uriOk) {
    return res.status(400).json({ error: 'Domain/URI mismatch' })
  }

  // Optional: enforce a single domain in production
  if (process.env.NODE_ENV === 'production' && PROD_DOMAIN) {
    if (domainLower !== PROD_DOMAIN) {
      return res.status(400).json({ error: 'Domain not allowed' })
    }
  }

  // ── 2) Signature + nonce verification
  try {
    const result = await siwe.verify({
      signature,
      domain: siwe.domain,     // we already validated domain; pass through
      nonce: serverNonce,
      time: new Date().toISOString(),
    })
    if (!result.success) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch (e: any) {
    return res.status(401).json({ error: e?.message || 'Verification failed' })
  }

  // ── 3) Mark nonce used and establish session
  await kv.set(nonceReuseKey, 1, { ex: NONCE_TTL_SEC })
  ;(session as any).nonce = undefined

  ;(session as any).address = siwe.address
  ;(session as any).isLoggedIn = true
  ;(session as any).lastActivity = Date.now()
  await session.save()

  // Do NOT assign membership/rank here; leave to /api/auth or a later step
  return res.status(200).json({
    isLoggedIn: true,
    address: siwe.address,
  })
}
