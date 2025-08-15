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
  membership?: 'public' | 'sgbcode' | 'sudopartypass'
  rank?: number // 1..3
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  identifier: null,
  pk: null,
  type: null,
  membership: 'public',
  rank: 1,
}

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'engine',
  cookieOptions: {
    secure: isProd,
    sameSite: 'lax',
  },
}