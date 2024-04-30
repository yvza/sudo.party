import { SessionOptions } from "iron-session";
import { isProd } from "@/config";

export const sessionApiRoute = "/api/auth";

export interface SessionData {
  sk: string,
  identifier: string,
  type: string,
  isLoggedIn: boolean
}

export const defaultSession: SessionData = {
  sk: '',
  identifier: '',
  type: '',
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieName: "engine",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: isProd,
  },
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}