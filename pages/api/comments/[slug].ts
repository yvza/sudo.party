import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";
import { turso } from "@/lib/turso";
import { getRequiredMembershipForSlug } from "@/lib/posts-meta";

function toUnix(ts: unknown) {
  if (typeof ts === "number") return ts;
  const d = new Date(String(ts));
  return Math.floor(d.getTime() / 1000);
}

async function ensureWallet(addressLower: string, session: SessionData) {
  // Prefer session.pk if present and matching
  if (session?.pk) {
    const rs = await turso.execute({
      sql: `SELECT w.id AS id, w.address AS address, mt.rank AS rank
            FROM wallets w LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
            WHERE w.id = ?`,
      args: [Number(session.pk)],
    });
    if (rs.rows.length && String(rs.rows[0].address).toLowerCase() === addressLower) {
      return { walletId: Number(rs.rows[0].id), userRank: (rs.rows[0].rank as number) ?? 1 };
    }
  }

  // Lookup by address
  let rs2 = await turso.execute({
    sql: `SELECT w.id AS id, mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });
  if (rs2.rows.length) {
    const walletId = Number(rs2.rows[0].id);
    const userRank = (rs2.rows[0].rank as number) ?? 1;
    if (!session.pk) session.pk = walletId;
    return { walletId, userRank };
  }

  // Insert with default membership
  const def = await turso.execute({
    sql: `SELECT id, rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
  });
  const defaultId = Number(def.rows[0].id);
  const defaultRank = Number(def.rows[0].rank);

  await turso.execute({
    sql: `INSERT INTO wallets (address, membership_type_id) VALUES (?, ?)`,
    args: [addressLower, defaultId],
  });

  const after = await turso.execute({
    sql: `SELECT w.id AS id, mt.rank AS rank
          FROM wallets w LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  const walletId = Number(after.rows[0].id);
  const userRank = (after.rows[0].rank as number) ?? defaultRank;
  session.pk = walletId;
  return { walletId, userRank };
}

async function requiredRankForPost(slug: string) {
  const membershipSlug = getRequiredMembershipForSlug(slug) ?? "public";
  const rs = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE slug = ?`,
    args: [membershipSlug],
  });
  return (rs.rows[0]?.rank as number) ?? 1;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slugQ = req.query.slug;
  const slug = Array.isArray(slugQ) ? slugQ[0] : slugQ || "";
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  if (req.method === "GET") {
    const rs = await turso.execute({
      sql: `SELECT c.id AS id,
                   c.post_slug AS slug,
                   w.address AS authorAddress,
                   c.content AS body,
                   c.parent_id AS parentId,
                   c.created_at AS createdAt
            FROM comments c
            JOIN wallets w ON w.id = c.wallet_id
            WHERE c.post_slug = ? AND c.is_deleted = 0 AND c.is_approved = 1
            ORDER BY c.created_at ASC`,
      args: [slug],
    });

    const comments = rs.rows.map((r: any) => ({
      id: r.id,
      slug: r.slug,
      authorAddress: r.authorAddress,
      body: r.body,
      parentId: r.parentId,
      createdAt: toUnix(r.createdAt),
    }));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ comments });
  }

  if (req.method === "POST") {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!(session.isLoggedIn && session.identifier)) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const addressLower = String(session.identifier).toLowerCase();
    const { walletId, userRank } = await ensureWallet(addressLower, session);
    const requiredRank = await requiredRankForPost(slug);
    if (userRank < requiredRank) {
      return res.status(403).json({ error: "Membership not eligible" });
    }

    const { body, parentId } = (typeof req.body === "object" ? req.body : {}) as {
      body?: string;
      parentId?: number | null;
    };

    const trimmed = (body ?? "").trim();
    if (!trimmed) return res.status(400).json({ error: "Empty comment" });
    if (trimmed.length > 2000) return res.status(413).json({ error: "Too long" });

    await turso.execute({
      sql: `INSERT INTO comments (post_slug, wallet_id, content, parent_id) VALUES (?, ?, ?, ?)`,
      args: [slug, walletId, trimmed, parentId ?? null],
    });

    await (session as any).save?.();
    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
