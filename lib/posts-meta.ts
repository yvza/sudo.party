import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export function getRequiredMembershipForSlug(slug: string): string {
  const postsDir = path.join(process.cwd(), "posts");
  const candidates = [path.join(postsDir, `${slug}.mdx`), path.join(postsDir, `${slug}.md`)];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const src = fs.readFileSync(p, "utf8");
      const { data } = matter(src);
      return (data?.membership as string | undefined) ?? "public";
    }
  }
  return "public";
}