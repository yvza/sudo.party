import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";

// policy (tweak as you like)
export const ABS_DEFAULT_MS  = 24 * 60 * 60 * 1000;     // 24h
export const ABS_REMEMBER_MS = 7  * 24 * 60 * 60 * 1000; // 7d
export const IDLE_DEFAULT_MS = 30 * 60 * 1000;          // 30m
export const IDLE_REMEMBER_MS= 12 * 60 * 60 * 1000;     // 12h
export const FRESH_MS        = 24 * 60 * 60 * 1000;     // 24h (fresh signature window)

export async function requireActiveSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isLoggedIn || !session.identifier) {
    return { ok: false as const, session, reason: "unauthenticated" as const };
  }

  const now = Date.now();
  const absMs  = session.remember ? ABS_REMEMBER_MS  : ABS_DEFAULT_MS;
  const idleMs = session.remember ? IDLE_REMEMBER_MS : IDLE_DEFAULT_MS;

  if (!session.createdAt)   session.createdAt = now;
  if (!session.lastActivity) session.lastActivity = now;

  // absolute timeout
  if (now - session.createdAt > absMs) {
    await session.destroy();
    return { ok: false as const, session, reason: "absolute_expired" as const };
  }

  // idle timeout (rolling)
  if (now - session.lastActivity > idleMs) {
    await session.destroy();
    return { ok: false as const, session, reason: "idle_expired" as const };
  }

  session.lastActivity = now; // roll forward
  await session.save();
  return { ok: true as const, session };
}

// Optional helper for sensitive actions (needs recent signature)
export function isSignatureFresh(session: SessionData, maxMs = FRESH_MS) {
  return !!session.lastSignedAt && (Date.now() - session.lastSignedAt) <= maxMs;
}
