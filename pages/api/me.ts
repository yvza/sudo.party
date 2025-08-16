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

  if (!rs.rows.length) {
    return res.status(200).json({
      authenticated: true,
      address: addressLower,
      membership: { slug: "public", name: "Public", rank: 1 },
    });
  }

  const row: any = rs.rows[0];
  const membership = row.slug
    ? { slug: row.slug, name: row.name, rank: row.rank ?? 1 }
    : { slug: "public", name: "Public", rank: 1 };

  if (!session.pk && row.walletId) {
    session.pk = Number(row.walletId);
    session.membership = membership.slug as any;
    session.rank = membership.rank as any;
    await (session as any).save?.();
  }

  return res.status(200).json({ authenticated: true, address: addressLower, membership });
}
