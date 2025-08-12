import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/iron-session/config";
import { bundleMDX } from "mdx-bundler";
import { encryptJson, isDevBypass } from "@/utils/helper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query as { slug?: string };
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  const filePath = path.join("./posts", `${slug}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);

  const visibility = (data as any).visibility ?? "public";
  const draft = (data as any).draft ?? false;

  const isPrivateOrDraft = draft || visibility === "private";
  const mustEnforceAuth = isPrivateOrDraft && !isDevBypass;

  if (mustEnforceAuth) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    const isLoggedIn = !!session?.isLoggedIn;
    if (!isLoggedIn) {
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // Cache policy: never public-cache private/draft; public can be cacheable.
  if (isPrivateOrDraft) {
    res.setHeader("Cache-Control", "private, no-store");
  } else {
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  }

  const { code, frontmatter } = await bundleMDX({ source: raw, cwd: process.cwd() });

  // Encrypt the payload (no plaintext MDX/code on the wire)
  const payload = JSON.stringify({ code, frontmatter, slug });
  const encryptedBuf = encryptJson(payload);
  const encryptedBase64 = Buffer.from(encryptedBuf).toString("base64");

  return res.status(200).json({ data: encryptedBase64 });
}
