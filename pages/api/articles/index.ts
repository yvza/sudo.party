import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { isDevBypass } from "@/utils/helper";
import { turso } from "@/lib/turso";

type Meta = {
  slug: string;
  title?: string;
  date?: string;
  tags?: string[];
  label?: string;
  description?: string;
  draft?: boolean;
  membership?: "public" | "supporter" | "sudopartypass";
};

// membership helpers
const MembershipRank = { public: 1, supporter: 2, sudopartypass: 3 } as const;
type MembershipSlug = keyof typeof MembershipRank;
const normalizeMembership = (v?: string): MembershipSlug => {
  const x = (v || "public").toLowerCase();
  return (x in MembershipRank ? x : "public") as MembershipSlug;
};
const requiredRankFor = (slug?: string) => MembershipRank[normalizeMembership(slug)];

function readAllMeta(): Meta[] {
  const articlesDir = path.resolve("./posts");
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
  return files.map((fileName) => {
    const filePath = path.join(articlesDir, fileName);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const slug = fileName.replace(/\.mdx?$/, "");
    const tags =
      (data as any).label
        ? String((data as any).label)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : (data as any).tags ?? [];
    return {
      slug,
      title: (data as any).title,
      date: (data as any).date,
      tags,
      label: (data as any).label,
      description: (data as any).description ?? "",
      draft: Boolean((data as any).draft),
      membership: normalizeMembership((data as any).membership),
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.max(1, parseInt(String(req.query.limit ?? "10"), 10));
  const tag = req.query.tag ? String(req.query.tag) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  // resolve viewer rank (1..3)
  let userRank = 1;
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (session?.isLoggedIn && session.identifier) {
    const { rows } = await turso.execute({
      sql: `
        SELECT COALESCE(mt.rank, (SELECT rank FROM membership_types WHERE is_default=1)) AS rank
        FROM wallets w
        LEFT JOIN membership_types mt ON mt.id = w.membership_type_id
        WHERE w.address = ?
        LIMIT 1
      `,
      args: [session.identifier.toLowerCase()],
    });
    userRank = Number((rows[0] as any)?.rank ?? 1);
  }

  const bypass = isDevBypass;
  let all = readAllMeta();

  if (!bypass) {
    // hide drafts and posts above the viewer's rank
    all = all.filter((p) => !p.draft);
    all = all.filter((p) => requiredRankFor(p.membership) <= userRank);
  }

  if (tag) {
    all = all.filter((p) => (p.tags ?? []).includes(tag));
  }
  if (search) {
    const q = search.toLowerCase();
    all = all.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }

  all.sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0));

  const total = all.length;
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);

  // lists may include gated items → avoid public caching
  res.setHeader("Cache-Control", "private, no-store");

  return res.status(200).json({ total, page, limit, data });
}