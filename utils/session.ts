import { isProd } from "@/config";
import { secureCookieAlias } from "@/lib/constants";

export const siweSessionConfig = {
  cookieName: secureCookieAlias.SIWE_SESSION,
  password: process.env.IRON_SESSION_PASSWORD as string,
  cookieOptions: {
    secure: isProd,
    maxAge: 60 * 60 * 8 // 8 hours
  },
};