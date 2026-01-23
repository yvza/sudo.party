import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

type PostMeta = {
  membership?: string;
  price?: number;
  title?: string;
  date?: string;
  draft?: boolean;
  locale?: string;
  translations?: Record<string, string>;
};

/**
 * Get the file path for a post, checking for locale-specific versions first.
 * Priority: article.{locale}.md > article.md (fallback to default)
 */
export function getPostFilePath(slug: string, locale: string = 'id'): string | null {
  const postsDir = path.join(process.cwd(), "posts");

  // For non-default locales, try locale-specific file first
  if (locale !== 'id') {
    const localeSpecificCandidates = [
      path.join(postsDir, `${slug}.${locale}.mdx`),
      path.join(postsDir, `${slug}.${locale}.md`),
    ];
    for (const p of localeSpecificCandidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }

  // Fallback to default (Indonesian) file
  const defaultCandidates = [
    path.join(postsDir, `${slug}.mdx`),
    path.join(postsDir, `${slug}.md`),
  ];
  for (const p of defaultCandidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Check if a locale-specific translation exists for an article
 */
export function hasTranslation(slug: string, locale: string): boolean {
  if (locale === 'id') return true; // Default always exists if article exists

  const postsDir = path.join(process.cwd(), "posts");
  const candidates = [
    path.join(postsDir, `${slug}.${locale}.mdx`),
    path.join(postsDir, `${slug}.${locale}.md`),
  ];
  return candidates.some(p => fs.existsSync(p));
}

/**
 * Get available translations for an article
 */
export function getAvailableTranslations(slug: string): string[] {
  const postsDir = path.join(process.cwd(), "posts");
  const locales = ['id', 'en', 'zh'];
  const available: string[] = [];

  for (const locale of locales) {
    if (locale === 'id') {
      // Check if default file exists
      const defaultExists = [
        path.join(postsDir, `${slug}.mdx`),
        path.join(postsDir, `${slug}.md`),
      ].some(p => fs.existsSync(p));
      if (defaultExists) available.push(locale);
    } else {
      if (hasTranslation(slug, locale)) {
        available.push(locale);
      }
    }
  }

  return available;
}

function getPostMeta(slug: string, locale: string = 'id'): PostMeta | null {
  const filePath = getPostFilePath(slug, locale);
  if (filePath) {
    const src = fs.readFileSync(filePath, "utf8");
    const { data } = matter(src);
    return data as PostMeta;
  }
  return null;
}

export function getRequiredMembershipForSlug(slug: string): string {
  const meta = getPostMeta(slug);
  return meta?.membership ?? "public";
}

/**
 * Get the individual purchase price for an article (in USD).
 * Returns null if the article doesn't have a price set (not purchasable individually).
 */
export function getArticlePrice(slug: string): number | null {
  const meta = getPostMeta(slug);
  const price = meta?.price;
  if (typeof price === "number" && price > 0) {
    return price;
  }
  return null;
}