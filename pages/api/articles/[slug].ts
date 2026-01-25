import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import matter from "gray-matter";
import { requireActiveSession } from "@/lib/auth/require-session";
import { requiredRankForPost, userRankForAddress } from "@/lib/auth/membership";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { bundleMDX } from "mdx-bundler";
import { encryptJson, isDevBypass } from "@/utils/helper";
import { turso } from "@/lib/turso";
import { getArticlePrice, getPostFilePath } from "@/lib/posts-meta";

// Membership helpers (single source of truth)
const MembershipRank = { public: 1, supporter: 2, sudopartypass: 3 } as const;
type MembershipSlug = keyof typeof MembershipRank;
const normalizeMembership = (v?: string): MembershipSlug => {
  const x = (v || "public").toLowerCase();
  return (x in MembershipRank ? x : "public") as MembershipSlug;
};

// Check if user has purchased a specific article
async function hasArticlePurchase(address: string, slug: string): Promise<boolean> {
  try {
    const { rows } = await turso.execute({
      sql: `
        SELECT 1 FROM article_purchases ap
        JOIN wallets w ON w.id = ap.wallet_id
        WHERE w.address = ? AND ap.article_slug = ?
        LIMIT 1
      `,
      args: [address.toLowerCase(), slug.toLowerCase()],
    });
    return rows.length > 0;
  } catch {
    // Table might not exist yet
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, locale = 'id' } = req.query as { slug?: string; locale?: string };
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  // 🔒 Guard GET (and HEAD) — prevent cURL scraping of gated content
  if (req.method === "GET" || req.method === "HEAD") {
    const { ok, session } = await requireActiveSession(req, res);
    if (!ok || !session?.identifier) {
      return res.status(401).json({ error: "Not authenticated", reason: "LOGIN_REQUIRED" });
    }

    const address = String(session.identifier).toLowerCase();
    const [need, have] = await Promise.all([
      requiredRankForPost(slug),
      userRankForAddress(address),
    ]);

    if (have < need) {
      // Check if user has purchased this specific article
      const hasPurchased = await hasArticlePurchase(address, slug);
      if (!hasPurchased) {
        // Get article price for the error response
        const articlePrice = getArticlePrice(slug);
        return res.status(403).json({
          error: "Membership not eligible",
          reason: "INSUFFICIENT_MEMBERSHIP",
          requiredRank: need,
          userRank: have,
          articlePrice,
        });
      }
      // User has purchased - allow access (fall through)
    }
  }
  
  const filePath = getPostFilePath(slug, locale);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

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

      // Resolve viewer rank from DB using centralized function (includes expiry check)
      const address = session.identifier?.toLowerCase();
      const userRank = address ? await userRankForAddress(address) : 1;

      const requiredSlug = membership // from frontmatter, e.g. 'supporter' or 'sudopartypass'
      if (userRank < requiredRank) {
        // Check if user has purchased this specific article
        const hasPurchased = await hasArticlePurchase(address || "", slug);
        if (!hasPurchased) {
          // Get article price for the error response
          const articlePrice = getArticlePrice(slug);
          res.setHeader("Cache-Control", "private, no-store");
          return res.status(403).json({
            error: "Forbidden",
            reason: "INSUFFICIENT_MEMBERSHIP",        // ← key
            message: "Your membership level is not high enough to view this post.",
            required: requiredSlug,                   // 'supporter' | 'sudopartypass'
            userMembership: session.membership || 'public',
            userRank,
            articlePrice,                             // Include price if available for purchase CTA
          })
        }
        // User has purchased - allow access (fall through)
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