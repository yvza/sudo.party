import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from './lib/iron-session/config'

export const config = {
  matcher: ['/', '/auth', '/blog/:path*', '/api/articles/:path*'],
}

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
})

export default async function middleware(req: NextRequest) {
  // Auth redirect still applies
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (req.nextUrl.pathname.startsWith('/auth') && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/blog', req.url))
  }

  // 🚫 Skip rate limiting in dev or when ALLOW_ALL_POSTS
  const isDevBypass =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_ALL_POSTS === '1';
  if (isDevBypass) {
    return NextResponse.next()
  }

  // ✅ Only rate-limit in production
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'

  const { success } = await ratelimit.limit(ip)
  return success
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/blocked', req.url))
}
