import Client from './client'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // read ONLY frontmatter (safe) — do not pass content/code here
  const filePath = path.join(process.cwd(), 'posts', `${slug}.md`)
  let frontTitle: string | undefined
  let frontDate: string | undefined

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)
    frontTitle = (data as any)?.title
    frontDate = (data as any)?.date
  }

  return <Client slug={slug} frontTitle={frontTitle} frontDate={frontDate} />
}
