import type { NextApiRequest, NextApiResponse } from "next";
import { turso } from "@/lib/turso";
import { getRequiredMembershipForSlug } from "@/lib/posts-meta";
import { requireActiveSession } from "@/lib/auth/require-session";
import { assertSameOrigin } from "@/utils/helper";

const MAX_COMMENT_CHARS = 500;

// ES5-safe: surrogate-pair aware code point counter
function countGraphemes(input: string): number {
  let n = 0;
  for (let i = 0; i < input.length; i++, n++) {
    const c = input.charCodeAt(i);
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

async function requiredRankForPost(slug: string) {
  const membershipSlug = getRequiredMembershipForSlug(slug) ?? "public";
  const rs = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE slug = ?`,
    args: [membershipSlug],
  });
  return (rs.rows[0]?.rank as number) ?? 1;
}

// Read the user's rank WITHOUT creating a wallet row
async function userRankForAddress(addressLower: string) {
  const rs = await turso.execute({
    sql: `SELECT mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });
  if (rs.rows.length) return (rs.rows[0].rank as number) ?? 1;

  // fallback to default membership rank
  const def = await turso.execute({
    sql: `SELECT rank FROM membership_types WHERE is_default = 1 LIMIT 1`,
  });
  return (def.rows[0]?.rank as number) ?? 1;
}

// Create or find wallet row (used only for POST)
async function ensureWallet(addressLower: string) {
  // Try to find first
  let rs = await turso.execute({
    sql: `SELECT w.id AS id, mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });
  if (rs.rows.length) {
    return {
      walletId: Number(rs.rows[0].id),
      userRank: (rs.rows[0].rank as number) ?? 1,
    };
  }

  // Insert with default membership (race-safe)
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

  // Re-select
  rs = await turso.execute({
    sql: `SELECT w.id AS id, mt.rank AS rank
          FROM wallets w
          LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
          WHERE w.address = ?`,
    args: [addressLower],
  });

  return {
    walletId: Number(rs.rows[0].id),
    userRank: (rs.rows[0].rank as number) ?? defaultRank,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugQ = req.query.slug;
  const slug = Array.isArray(slugQ) ? slugQ[0] : slugQ || "";
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  if (req.method === "GET") {
    // NEW: require active session (idle/absolute TTL enforced)
    const { ok, session, reason } = await requireActiveSession(req, res);
    if (!ok) {
      return res
        .status(401)
        .json({ error: "Not authenticated", reason: "LOGIN_REQUIRED" });
    }

    const addressLower = String(session.identifier).toLowerCase();
    const [userRank, requiredRank] = await Promise.all([
      userRankForAddress(addressLower),
      requiredRankForPost(slug),
    ]);

    if (userRank < requiredRank) {
      return res.status(403).json({
        error: "Membership not eligible",
        reason: "INSUFFICIENT_MEMBERSHIP",
        requiredRank,
        userRank,
      });
    }

    const rs = await turso.execute({
      sql: `SELECT c.id AS id,
                   c.post_slug AS slug,
                   w.address AS authorAddress,
                   c.content AS body,
                   c.parent_id AS parentId,
                   c.created_at AS createdAt,
                   mt.slug AS membershipSlug,
                   w.membership_expires_at AS membershipExpiresAt,
                   CASE WHEN w.address = ? THEN 1 ELSE 0 END AS isCreator
            FROM comments c
            JOIN wallets w ON w.id = c.wallet_id
            LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
            WHERE c.post_slug = ? AND c.is_deleted = 0 AND c.is_approved = 1
            ORDER BY c.created_at ASC`,
      args: [process.env.CREATOR_ADDRESS?.toLowerCase() || "", slug],
    });

    const nowUnix = Math.floor(Date.now() / 1000);
    const comments = rs.rows.map((r: any) => {
      const expiresAt = r.membershipExpiresAt
        ? Number(r.membershipExpiresAt)
        : null;
      const isExpired = expiresAt !== null && expiresAt <= nowUnix;

      return {
        id: r.id,
        slug: r.slug,
        authorAddress: r.authorAddress,
        body: r.body,
        parentId: r.parentId,
        createdAt: toUnix(r.createdAt),
        membershipSlug: isExpired ? "public" : r.membershipSlug || "public",
        isCreator: Boolean(r.isCreator),
      };
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ comments });
  }

  if (req.method === "POST") {
    if (!assertSameOrigin(req)) {
      return res
        .status(403)
        .json({ error: "CSRF protection: origin mismatch" });
    }

    const { ok, session, reason } = await requireActiveSession(req, res);
    if (!ok) {
      return res.status(401).json({ error: "Not authenticated", reason });
    }

    const addressLower = String(session.identifier).toLowerCase();
    const { walletId, userRank } = await ensureWallet(addressLower);
    const requiredRank = await requiredRankForPost(slug);
    if (userRank < requiredRank) {
      return res.status(403).json({ error: "Membership not eligible" });
    }

    const { body, parentId } = (
      typeof req.body === "object" ? req.body : {}
    ) as {
      body?: string;
      parentId?: number | null;
    };

    // Validate parentId to be positive integer & same post if provided
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

    return res.status(201).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end("Method Not Allowed");
}
