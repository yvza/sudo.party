// @ts-ignore
import type { NextRequest } from 'next/server'
// @ts-ignore
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { ipAddress } from '@vercel/functions'
import createIntlMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './lib/i18n-config'

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Hide /id prefix, show /en and /zh
  localeDetection: false // Don't auto-detect browser language, use default
})

// Compute seconds until midnight UTC (or choose your own reset window)
function ttlToMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1, 0, 0, 0
  ))
  return Math.max(60, Math.floor((+tomorrow - +now) / 1000))
}

// INCR key with TTL (set TTL only on first hit)
async function incrWithTtl(key: string, ttlSec: number): Promise<number> {
  const n = await kv.incr(key)
  if (n === 1) await kv.expire(key, ttlSec)
  return n
}

// Quick denylist helpers
async function getBanTTL(key: string): Promise<number> {
  // Vercel KV doesn’t expose TTL directly; keep a parallel expire key if you want exact TTL.
  // For simplicity, just return a fixed hint here. You can store a timestamp if you need precise remaining TTL.
  const banned = await kv.get(key)
  return banned ? 900 : 0 // 15 minutes if present
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}

const COOKIE_NAME = 'engine'

type Rule = { tokens: number; window: `${number} ${'s'|'m'|'h'}` }

function vercelEnv() {
  return (process.env.VERCEL_ENV as 'development'|'preview'|'production'|undefined)
      ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development')
}

// Route/method specific budgets (Preview is looser than Prod)
function pickRule(pathname: string, method: string): Rule {
  const env = vercelEnv()

  // normalize dynamic segments so each logical endpoint has one bucket
  const coarse = pathname.replace(/\/\d+|\/[a-f0-9]{6,}/gi, '/:id')

  const isCommentsGet  = method === 'GET'  && /^\/api\/comments\/.+$/.test(coarse)
  const isCommentsPost = method === 'POST' && /^\/api\/comments\/.+$/.test(coarse)
  const isArticles     = /^\/api\/articles(\/.*)?$/.test(coarse)
  const isSiweNonce    = method === 'GET'  && /^\/api\/siwe\/nonce$/.test(coarse)
  const isSiweVerify   = method === 'POST' && /^\/api\/siwe\/verify$/.test(coarse)

  if (isSiweNonce)  return env === 'preview' ? { tokens: 30, window: '1 m' } : { tokens: 15, window: '1 m' }
  if (isSiweVerify) return env === 'preview' ? { tokens: 10, window: '5 m' } : { tokens: 3,  window: '5 m' }

  if (isCommentsGet)  return env === 'preview' ? { tokens: 300, window: '1 m' } : { tokens: 150, window: '1 m' }
  if (isCommentsPost) return env === 'preview' ? { tokens: 40,  window: '5 m' } : { tokens: 20,  window: '5 m' }

  if (isArticles)     return env === 'preview' ? { tokens: 600, window: '1 m' } : { tokens: 300, window: '1 m' }

  // fallback for other APIs
  return env === 'preview' ? { tokens: 300, window: '1 m' } : { tokens: 120, window: '1 m' }
}

function clientIp(req: NextRequest) {
  const ip = ipAddress(req as unknown as Request)

  return (
    ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

// edge-safe SHA-256
async function hash(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('')
}

// cache limiter instances across hot reloads
const _cache = (globalThis as any).__rlcache ?? new Map<string, Ratelimit>()
if (!(globalThis as any).__rlcache) (globalThis as any).__rlcache = _cache
function getLimiter(tokens: number, window: `${number} ${'s'|'m'|'h'}`) {
  const k = `${tokens}:${window}`
  if (!_cache.has(k)) {
    _cache.set(k, new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(tokens, window),
      analytics: false,
      prefix: 'rl',
    }))
  }
  return _cache.get(k)!
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // For API routes, apply rate limiting logic
  if (pathname.startsWith('/api')) {
    const env = vercelEnv()

    // Bypass in local dev or when explicitly allowed
    if (env === 'development' || process.env.ALLOW_ALL_POSTS === '1') {
      return NextResponse.next()
    }

    // Skip cheap non-mutating methods
    if (req.method === 'OPTIONS' || req.method === 'HEAD') {
      return NextResponse.next()
    }

    const rule = pickRule(req.nextUrl.pathname, req.method)
    const ip = clientIp(req)
    const cookieShort = req.cookies.get(COOKIE_NAME)?.value?.slice(0, 32) || '-'
    const coarse = req.nextUrl.pathname.replace(/\/\d+|\/[a-f0-9]{6,}/gi, '/:id')
    const key = await hash(`${ip}|${cookieShort}|${req.method}|${coarse}|${env}`)

    // ── A) Temporary ban (denylist) check
    const banKey = `ban:${env}:${ip}:${coarse}` // ban by IP; optionally append coarse if you want route-specific bans
    const banTtl = await getBanTTL(banKey)
    if (banTtl > 0) {
      return NextResponse.json(
        { error: 'Too many requests (temporary ban)', retryAfter: banTtl },
        { status: 429, headers: new Headers({ 'Retry-After': String(banTtl) }) }
      )
    }

    // ── B) Daily quota (per route/method/key)
    const dayTtl = ttlToMidnight()
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS'
    const dayKey = `q:day:${coarse}:${req.method}:${env}:${ip}:${cookieShort}`
    const dayCap = (() => {
      // Real-world daily caps (tune per your app)
      // Very generous for reads; much lower for writes.
      if (/^\/api\/articles/.test(coarse))      return env === 'preview' ? 10000 : 6000
      if (/^\/api\/comments\/.+$/.test(coarse)) return isWrite ? (env === 'preview' ? 400 : 200)
                                                    : (env === 'preview' ? 5000 : 2500)
      if (/^\/api\/siwe\//.test(coarse))        return isWrite ? 60 : 200 // keep strict
      return env === 'preview' ? 6000 : 3000
    })()

    const dayCount = await incrWithTtl(dayKey, dayTtl)
    if (dayCount > dayCap) {
      return NextResponse.json(
        { error: 'Daily quota exceeded', retryAfter: dayTtl },
        { status: 429, headers: new Headers({ 'Retry-After': String(dayTtl) }) }
      )
    }

    const limiter = getLimiter(rule.tokens, rule.window)
    const { success, remaining, reset, limit } = await limiter.limit(key)

    if (success) {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
      const resetSec = reset > 1e12 ? Math.floor(reset / 1000) : Math.floor(reset)
      headers.set('X-RateLimit-Reset', String(resetSec))
      headers.set('Cache-Control', 'no-store')
      return NextResponse.next({ headers })
    }

    // ── C) Strike escalation: repeat abusers get banned temporarily
    const strikeKey = `strike:${env}:${ip}:${coarse}`
    const strikes = await incrWithTtl(strikeKey, 3600) // track strikes for 1 hour
    if (strikes >= 10 && strikes < 30) {
      // first tier ban (if not already banned)
      const banned = await kv.get(banKey)
      if (!banned) await kv.set(banKey, 1, { ex: 15 * 60 })
    }
    if (strikes >= 30) {
      // escalate to 1 hour
      await kv.set(banKey, 1, { ex: 60 * 60 })
    }

    const nowSec = Math.floor(Date.now() / 1000)
    const resetSec = reset > 1e12 ? Math.floor(reset / 1000) : Math.floor(reset) // guard if ms
    const retryAfter = Math.max(1, resetSec - nowSec)
    const headers = new Headers({
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(resetSec),
      'Retry-After': String(retryAfter),
      'Cache-Control': 'no-store',
    })

    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429, headers }
    )
  }

  // For all other routes, apply i18n middleware
  return intlMiddleware(req)
}
