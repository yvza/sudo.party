'use client'

import React, { useMemo } from 'react'
import axios from 'axios'
import { useArticle } from '@/services/articles'
import { decryptJson, safeFormatDate } from '@/utils/helper'
import { getMDXComponent } from 'mdx-bundler/client'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeheIDK from '@/components/HeheIDK'
import Link from 'next/link'
import { skeletonBlogPost } from '@/components/Skeleton'

export default function Client({ slug }: { slug: string }) {
  // 1) Always call hooks (no early returns before this)
  const { data, error, isPending } = useArticle(slug)

  // 2) Derive flags/values (also hooks-safe)
  const isUnauthorized =
    axios.isAxiosError(error) && error.response?.status === 401

  const payload = useMemo(() => {
    if (!data?.data) return null
    const json = decryptJson(Buffer.from(data.data, 'base64').toString())
    try {
      return JSON.parse(json) as { code: string; frontmatter: any }
    } catch {
      return null
    }
  }, [data])

  const Mdx = useMemo(
    () => (payload?.code ? getMDXComponent(payload.code) : null),
    [payload?.code]
  )

  // 3) Now we can branch/return; hooks have already been called
  if (isUnauthorized) return <>
    <TopNav />
    <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
      <HeheIDK />
    </div>
    <BottomNav />
  </>

  if (isPending) return skeletonBlogPost()
  if (!payload) return <div className="p-4 text-sm text-red-500">Failed to load post.</div>

  const { frontmatter } = payload
  const displayDate = safeFormatDate(frontmatter?.date as any)

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-2xl py-8">
        <div className="mx-5 sm:mx-auto mb-6">
          <h1 className="text-2xl font-semibold">{frontmatter?.title}</h1>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            <time dateTime={displayDate ? new Date(frontmatter?.date as any).toISOString() : undefined}>
              {displayDate}
            </time>
            <span>•</span>
            <Link href="/blog" className="border-b hover:opacity-80">Back</Link>
          </div>
        </div>
        <div className="mx-5 sm:mx-auto">
          <article className="prose dark:prose-invert max-w-none">
            {Mdx ? <Mdx /> : null}
          </article>
        </div>
      </div>
      <BottomNav />
    </>
  )
}
