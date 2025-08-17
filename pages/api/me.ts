import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";
import { turso } from "@/lib/turso";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const authenticated = Boolean(session.isLoggedIn && session.identifier);

  if (!authenticated) {
    return res.status(200).json({ authenticated: false, address: null, membership: null });
  }

  const addressLower = String(session.identifier).toLowerCase();
  const rs = await turso.execute({
    sql: `SELECT w.id AS walletId, w.address AS address, mt.slug AS slug, mt.name AS name, mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  // Default membership if no wallet row yet
  let membership = { slug: "public", name: "Public", rank: 1 } as const;
  let walletId: number | null = null;

  if (rs.rows.length) {
    const row: any = rs.rows[0];
    walletId = typeof row.walletId === "number" ? row.walletId : Number(row.walletId) || null;
    if (row.slug) {
      membership = { slug: row.slug, name: row.name, rank: row.rank ?? 1 } as const;
    }
  }

  // Sync session in one place (works whether a wallet row exists or not)
  if (!session.pk && walletId) {
    session.pk = walletId;
  }
  session.membership = membership.slug as any;
  session.rank = membership.rank as any;
  session.lastActivity = Date.now();
  await (session as any).save?.();

  return res.status(200).json({ authenticated: true, address: addressLower, membership });
}
