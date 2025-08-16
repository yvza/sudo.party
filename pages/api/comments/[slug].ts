import type { NextApiRequest, NextApiResponse } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/iron-session/config";
import { turso } from "@/lib/turso";
import { getRequiredMembershipForSlug } from "@/lib/posts-meta";

const MAX_COMMENT_CHARS = 500;

// ES5-safe: surrogate-pair aware code point counter
function countGraphemes(input: string): number {
  let n = 0;
  for (let i = 0; i < input.length; i++, n++) {
    const c = input.charCodeAt(i);
    // if high surrogate followed by low surrogate, skip the next unit
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < input.length) {
      const d = input.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i++;
    }
  }
  return n;
}

function toUnix(ts: unknown) {
  if (typeof ts === "number") return ts;
  const d = new Date(String(ts));
  return Math.floor(d.getTime() / 1000);
}

async function ensureWallet(addressLower: string, session: SessionData) {
  // If session.pk exists, verify it matches this address
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
    if (!session.pk) {
      session.pk = walletId;
      await (session as any).save?.();
    }
    return { walletId, userRank };
  }

  // Insert with default membership — race-safe via ON CONFLICT
  const def = await turso.execute({
    sql: `SELECT id, rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
  });
  const defaultId = Number(def.rows[0].id);
  const defaultRank = Number(def.rows[0].rank);

  await turso.execute({
    sql: `INSERT INTO wallets (address, membership_type_id)
          VALUES (?, ?)
          ON CONFLICT(address) DO NOTHING`,
    args: [addressLower, defaultId],
  });

  // Re-select after potential upsert
  const after = await turso.execute({
    sql: `SELECT w.id AS id, mt.rank AS rank
          FROM wallets w LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  const walletId = Number(after.rows[0].id);
  const userRank = (after.rows[0].rank as number) ?? defaultRank;
  session.pk = walletId;
  await (session as any).save?.();
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

    // Validate parentId (must be positive int and belong to the same post; not deleted)
    let parent: number | null = null;
    if (parentId != null) {
      const pid = Number(parentId);
      if (!Number.isInteger(pid) || pid <= 0) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
      const chk = await turso.execute({
        sql: `SELECT 1 FROM comments WHERE id = ? AND post_slug = ? AND is_deleted = 0`,
        args: [pid, slug],
      });
      if (!chk.rows.length) {
        return res.status(400).json({ error: "Invalid parentId" });
      }
      parent = pid;
    }

    // Length checks (grapheme-aware)
    const trimmed = (body ?? "").trim();
    if (!trimmed) return res.status(400).json({ error: "Empty comment" });
    const charCount = countGraphemes(trimmed);
    if (charCount > MAX_COMMENT_CHARS) {
      return res.status(413).json({
        error: `Too long (max ${MAX_COMMENT_CHARS} characters)`,
        max: MAX_COMMENT_CHARS,
      });
    }

    await turso.execute({
      sql: `INSERT INTO comments (post_slug, wallet_id, content, parent_id) VALUES (?, ?, ?, ?)`,
      args: [slug, walletId, trimmed, parent],
    });

    await (session as any).save?.();
    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
