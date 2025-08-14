'use client'

import React, { useMemo } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'
import { useArticle } from '@/services/articles'
import { decryptJson, safeFormatDate } from '@/utils/helper'
import { getMDXComponent } from 'mdx-bundler/client'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeheIDK from '@/components/HeheIDK'
import Link from 'next/link'

// defer comments (non-critical) to after paint
const CommentSection = dynamic(
  () => import('@/components/blog/comment/comment-section'),
  { ssr: false }
)

export default function Client({
  slug,
  frontTitle,
  frontDate
}: { slug: string; frontTitle?: string; frontDate?: string }) {

  // show title/date immediately for better LCP
  const earlyDate = safeFormatDate(frontDate as any)

  const { data, error, isPending } = useArticle(slug)
  const isUnauthorized = axios.isAxiosError(error) && error.response?.status === 401

  const payload = useMemo(() => {
    if (!data?.data) return null
    const json = decryptJson(Buffer.from(data.data, 'base64').toString('utf-8'))
    try { return JSON.parse(json) as { code: string; frontmatter: any } } catch { return null }
  }, [data])

  const Mdx = useMemo(
    () => (payload?.code ? getMDXComponent(payload.code) : null),
    [payload?.code]
  )

  if (isUnauthorized) return <HeheIDK />
  // keep your existing pending/error fallbacks below, after showing H1/date

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-2xl py-8">
        <div className="mx-5 sm:mx-auto mb-6">
          <h1 className="text-2xl font-semibold">{payload?.frontmatter?.title ?? frontTitle}</h1>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            <time dateTime={(payload?.frontmatter?.date || frontDate) ? new Date(payload?.frontmatter?.date ?? frontDate as any).toISOString() : undefined}>
              {safeFormatDate(payload?.frontmatter?.date as any) || earlyDate}
            </time>
            <span>•</span>
            <Link href="/blog" className="border-b hover:opacity-80">Back</Link>
          </div>
        </div>

        <div className="mx-5 sm:mx-auto">
          {isPending && <div className="p-4 text-sm text-zinc-500">Loading…</div>}
          {!isPending && !payload && <div className="p-4 text-sm text-red-500">Failed to load post.</div>}
          {!isPending && payload && (
            <article className="prose dark:prose-invert max-w-none">
              {Mdx ? <Mdx /> : null}
            </article>
          )}
          <CommentSection />
        </div>
      </div>
      <BottomNav />
    </>
  )
}
