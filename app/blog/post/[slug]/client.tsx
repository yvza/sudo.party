'use client'

import React, { useMemo } from 'react'
import { isFetchError } from '@/utils/fetcher'
// @ts-ignore
import dynamic from 'next/dynamic'
import { useArticle } from '@/services/articles'
import { decryptJson, safeFormatDate } from '@/utils/helper'
import { getMDXComponent } from 'mdx-bundler/client'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeheIDK from '@/components/HeheIDK'
// @ts-ignore
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter();
  const earlyDate = safeFormatDate(frontDate as any)

  const { data, error, isPending } = useArticle(slug)

  // Map Fetch error -> HeheIDK props (dynamic)
  const errProps = useMemo(() => {
    if (!isFetchError(error)) return null
    const status = error.status ?? 0
    const body = (error.data ?? {}) as any
    return {
      status,
      reason: body.reason as any,             // e.g. 'LOGIN_REQUIRED' | 'INSUFFICIENT_MEMBERSHIP'
      message: body.message as string | undefined,
      requiredRank: body.requiredRank as any,         // 'public' | 'supporter' | 'sudopartypass'
      userRank: body.userRank as any,
    }
  }, [error])

  const payload = useMemo(() => {
    if (!data?.data) return null
    const json = decryptJson(Buffer.from(data.data, 'base64').toString('utf-8'))
    try { return JSON.parse(json) as { code: string; frontmatter: any } } catch { return null }
  }, [data])

  const Mdx = useMemo(
    () => (payload?.code ? getMDXComponent(payload.code) : null),
    [payload?.code]
  )

  // Early error UI (401/403/etc.) with human-readable copy
  if (errProps) {
    return (
      <>
        <TopNav />
        <div className="mx-auto max-w-2xl py-8">
          <div className="mx-5 sm:mx-auto">
            <HeheIDK
              status={errProps.status}
              reason={errProps.reason}
              message={errProps.message}
              requiredRank={errProps.requiredRank}
              userRank={errProps.userRank}
            />
          </div>
        </div>
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-2xl py-8">
        <div className="mx-5 sm:mx-auto mb-6">
          <h1 className="text-2xl font-semibold">{payload?.frontmatter?.title ?? frontTitle}</h1>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            <time dateTime={(payload?.frontmatter?.date || frontDate) ? new Date(payload?.frontmatter?.date ?? (frontDate as any)).toISOString() : undefined}>
              {safeFormatDate(payload?.frontmatter?.date as any) || earlyDate}
            </time>
            <span>•</span>
            <a
              href="/blog"
              className="border-b hover:opacity-80 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/blog");
                }
              }}
            >
              Back
            </a>
          </div>
        </div>

        <div className="mx-5 sm:mx-auto">
          {isPending && <div className="py-4 text-sm text-zinc-500">Loading…</div>}

          {!isPending && !payload && !error && (
            <HeheIDK status={404} reason="NOT_FOUND" />
          )}

          {!isPending && payload && (
            <>
              <article className="prose dark:prose-invert max-w-none">
                {Mdx ? <Mdx /> : null}
              </article>

              <CommentSection
                slug={slug}
                requiredSlug={payload.frontmatter?.membership ?? "public"}
              />
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </>
  )
}