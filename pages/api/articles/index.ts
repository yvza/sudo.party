import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { isDevBypass } from "@/utils/helper";

type Meta = {
  slug: string;
  title?: string;
  date?: string;
  tags?: string[];
  label?: string;
  description?: string;
  draft?: boolean;
  visibility?: "public" | "private";
};

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
      draft: (data as any).draft ?? false,
      visibility: (data as any).visibility ?? "public",
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // read query
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.max(1, parseInt(String(req.query.limit ?? "10"), 10));
  const tag = req.query.tag ? String(req.query.tag) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  // OPTIONAL: session (not used for filtering now, but you may want it later)
  await getIronSession<SessionData>(req, res, sessionOptions);

  // metadata only — include both public & private
  let all = readAllMeta();
  if (!isDevBypass) {
    all = all.filter(p => !p.draft);
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

  // Keep private from shared caches (and because list now includes private)
  res.setHeader("Cache-Control", "private, no-store");

  return res.status(200).json({ total, page, limit, data });
}
