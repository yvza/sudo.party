import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getPostFilePath, hasTranslation } from '@/lib/posts-meta'

type Meta = {
  slug: string
  title?: string
  date?: string
  tags?: string[]
  label?: string
  description?: string
  draft?: boolean
  membership?: 'public' | 'supporter' | 'sudopartypass'
  hasTranslation?: boolean
}

function readAllMeta(locale: string = 'id'): Meta[] {
  const dir = path.resolve('./posts')
  const files = fs.readdirSync(dir).filter(f => {
    // Only get base files (not locale-specific ones like article.en.md)
    if (!f.endsWith('.md') && !f.endsWith('.mdx')) return false
    // Exclude locale-specific files from the listing
    const parts = f.replace(/\.mdx?$/, '').split('.')
    if (parts.length > 1 && ['en', 'zh'].includes(parts[parts.length - 1])) {
      return false
    }
    return true
  })

  return files.map((fileName) => {
    const slug = fileName.replace(/\.mdx?$/, '')

    // Get the locale-specific file if available, otherwise fallback to default
    const filePath = getPostFilePath(slug, locale)
    if (!filePath) return null

    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)

    const tags = (data as any)?.label
      ? String((data as any).label).split(',').map((s: string) => s.trim()).filter(Boolean)
      : ((data as any)?.tags ?? [])

    return {
      slug,
      title: (data as any)?.title,
      date: (data as any)?.date,
      tags,
      label: (data as any)?.label,
      description: ((data as any)?.description as string) ?? '',
      draft: ((data as any)?.draft as boolean) ?? false,
      membership: ((data as any)?.membership as any) ?? 'public',
      hasTranslation: hasTranslation(slug, locale),
    }
  }).filter(Boolean) as Meta[]
}

export async function getArticlesServer({
  page,
  limit,
  locale = 'id'
}: {
  page: number
  limit: number
  locale?: string
}) {
  // show drafts only when ALLOW_ALL_POSTS=1 in dev
  const isDevBypass = process.env.NODE_ENV !== 'production' && process.env.ALLOW_ALL_POSTS === '1'

  let all = readAllMeta(locale)
  if (!isDevBypass) {
    all = all.filter(p => !p.draft)
  }

  all.sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0))
  const total = all.length
  const start = (page - 1) * limit
  const data = all.slice(start, start + limit)
  return { total, page, limit, data }
}
