import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

type Meta = {
  slug: string
  title?: string
  date?: string
  tags?: string[]
  label?: string
  description?: string
  draft?: boolean
  visibility?: 'public' | 'private'
}

function readAllMeta(): Meta[] {
  const dir = path.resolve('./posts')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  return files.map((fileName) => {
    const raw = fs.readFileSync(path.join(dir, fileName), 'utf-8')
    const { data } = matter(raw)
    const slug = fileName.replace(/\.mdx?$/, '')
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
      visibility: ((data as any)?.visibility as any) ?? 'public',
    }
  })
}

export async function getArticlesServer({ page, limit }: { page: number; limit: number }) {
  // show drafts only when ALLOW_ALL_POSTS=1 in dev
  const isDevBypass = process.env.NODE_ENV !== 'production' && process.env.ALLOW_ALL_POSTS === '1'

  let all = readAllMeta()
  if (!isDevBypass) {
    all = all.filter(p => !p.draft)
  }

  all.sort((a, b) => +new Date(b.date ?? 0) - +new Date(a.date ?? 0))
  const total = all.length
  const start = (page - 1) * limit
  const data = all.slice(start, start + limit)
  return { total, page, limit, data }
}
