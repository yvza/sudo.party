import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";

export async function getSession() {
  // In Next 15 types, cookies() can be Promise<ReadonlyRequestCookies>
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
