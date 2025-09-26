import type { NextApiRequest } from 'next'

/**
 * Returns the host (possibly with port) that the browser sees.
 * Works on localhost and behind proxies (Vercel, Nginx, etc).
 */
export function getExpectedSiweDomain(req: NextApiRequest): string {
  // Prefer x-forwarded-host when present (can be "a.com, b.com")
  const xfHost = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim()
  const host = xfHost || req.headers.host || ''
  return host.toLowerCase()
}