import { SessionOptions } from "iron-session";
import { isProd } from "@/config";

export type SessionData = {
  // existing fields (keep for compatibility)
  isLoggedIn: boolean
  identifier?: string | null   // wallet address (lowercase)
  pk?: number | null           // numeric wallets.id (DB primary key)
  type?: 'wallet' | string | null
  // siwe nonce (transient)
  nonce?: string
  // NEW fields for membership gating
  membership?: 'public' | 'supporter' | 'sudopartypass'
  rank?: number // 1..3

  // NEW: security metadata
  createdAt?: number        // epoch ms when session created
  lastActivity?: number     // epoch ms of last use
  remember?: boolean        // remember-me checkbox
  lastSignedAt?: number     // epoch ms when the user last SIWE-signed

  sessionEpoch?: number  // mirrors wallets.session_epoch; used to revoke old cookies
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  identifier: null,
  pk: null,
  type: null,
  membership: 'public',
  rank: 1,
  createdAt: 0,
  lastActivity: 0,
  remember: false,
  lastSignedAt: 0
}

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'engine',
  cookieOptions: {
    secure: isProd,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days cookie; server enforces stricter TTLs
  },
}