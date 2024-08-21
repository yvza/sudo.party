import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { SessionData, sessionOptions } from './lib/iron-session/config';
import { isProd } from './config';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

// Define which routes you want to rate limit
export const config = {
  matcher: ['/', '/auth', '/blog', '/api/articles'],
};

export default async function middleware(request: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)

  if (request.nextUrl.pathname.startsWith('/auth') && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/blog', request.url))
  }

  // You could alternatively limit based on user ID or similar
  const ip = request.ip ?? '127.0.0.1';
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    ip
  );
  return success
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/blocked', request.url));
}