import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { requireActiveSession } from "@/lib/auth/require-session";
import { requiredRankForPost, userRankForAddress } from "@/lib/auth/membership";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { bundleMDX } from "mdx-bundler";
import { encryptJson, isDevBypass } from "@/utils/helper";
import { turso } from "@/lib/turso";

// Membership helpers (single source of truth)
const MembershipRank = { public: 1, sgbcode: 2, sudopartypass: 3 } as const;
type MembershipSlug = keyof typeof MembershipRank;
const normalizeMembership = (v?: string): MembershipSlug => {
  const x = (v || "public").toLowerCase();
  return (x in MembershipRank ? x : "public") as MembershipSlug;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug?: string };
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  // 🔒 Guard GET (and HEAD) — prevent cURL scraping of gated content
  if (req.method === "GET" || req.method === "HEAD") {
    const { ok, session } = await requireActiveSession(req, res);
    if (!ok || !session?.identifier) {
      return res.status(401).json({ error: "Not authenticated", reason: "LOGIN_REQUIRED" });
    }

    const [need, have] = await Promise.all([
      requiredRankForPost(slug),
      userRankForAddress(String(session.identifier).toLowerCase()),
    ]);

    if (have < need) {
      return res.status(403).json({
        error: "Membership not eligible",
        reason: "INSUFFICIENT_MEMBERSHIP",
        requiredRank: need,
        userRank: have,
      });
    }
  }
  
  const filePath = path.join("./posts", `${slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);

  const membership = normalizeMembership((data as any).membership);
  const draft = Boolean((data as any).draft);

  if (!isDevBypass) {
    // 1) drafts: keep your old behavior (require login)
    if (draft) {
      const session = await getIronSession<SessionData>(req, res, sessionOptions);
      if (!session?.isLoggedIn) {
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(401).json({
          error: "Unauthorized",
          reason: "LOGIN_REQUIRED",                 // <— key
          message: "Please sign in with your wallet to access this post.",
        })
      }
    }

    // 2) membership gating
    const requiredRank = MembershipRank[membership];
    if (requiredRank > 1) {
      const session = await getIronSession<SessionData>(req, res, sessionOptions);
      if (!session?.isLoggedIn) {
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(401).json({
          error: "Unauthorized",
          reason: "LOGIN_REQUIRED",                 // <— key
          message: "Please sign in with your wallet to access this post.",
        })
      }

      // Resolve viewer rank from DB (default = 1)
      let userRank = 1;
      const address = session.identifier?.toLowerCase();
      if (address) {
        const { rows } = await turso.execute({
          sql: `
            SELECT COALESCE(mt.rank, (SELECT rank FROM membership_types WHERE is_default=1)) AS rank
            FROM wallets w
            LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
            WHERE w.address = ?
            LIMIT 1
          `,
          args: [address],
        });
        userRank = Number((rows[0] as any)?.rank ?? 1);
      }

      const requiredSlug = membership // from frontmatter, e.g. 'sgbcode' or 'sudopartypass'
      if (userRank < requiredRank) {
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(403).json({
          error: "Forbidden",
          reason: "INSUFFICIENT_MEMBERSHIP",        // <— key
          message: "Your membership level is not high enough to view this post.",
          required: requiredSlug,                   // 'sgbcode' | 'sudopartypass'
          userMembership: session.membership || 'public',
          userRank,
        })
      }
    }
  }

  // Cache policy
  const requiredRank = MembershipRank[membership];
  const isRestricted = draft || requiredRank > 1;
  if (isRestricted && !isDevBypass) {
    res.setHeader("Cache-Control", "private, no-store");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  }

  const { code, frontmatter } = await bundleMDX({ source: raw, cwd: process.cwd() });

  const payload = JSON.stringify({ code, frontmatter, slug });
  const encryptedBuf = encryptJson(payload);
  const encryptedBase64 = Buffer.from(encryptedBuf).toString("base64");

  return res.status(200).json({ data: encryptedBase64 });
}