'use client'

import React from 'react'
// @ts-ignore
import { Link, usePathname } from '@/lib/i18n-navigation'
import { safeFormatDate } from '@/utils/helper'
import { Badge } from './ui/badge'

type LegacyMeta = { slug: string }
type PostCardProps = {
  title?: string
  date?: string
  description?: string | null
  // legacy shape
  _meta?: LegacyMeta
  label?: string
  // new API shape
  slug?: string
  tags?: string[]
}

export default function PostCard(post: PostCardProps) {
  const noDescription = () => <em>No description provided.</em>

  const renderPostBadge = () => {
    const fromArray = Array.isArray(post.tags) ? post.tags : []
    const fromLabel =
      typeof post.label === 'string'
        ? post.label.split(',').map(s => s.trim()).filter(Boolean)
        : []

    // dedupe while preserving first seen casing
    const seen = new Map<string, string>()
    ;[...fromArray, ...fromLabel].forEach(t => {
      const k = t.toLowerCase()
      if (!seen.has(k)) seen.set(k, t)
    })
    const deduped = Array.from(seen.values())
    if (!deduped.length) return null

    const slug = post._meta?.slug ?? post.slug ?? 'post'
    return deduped.map((item) => (
      <Badge key={`${slug}-${item.toLowerCase()}`} variant="secondary">
        {item}
      </Badge>
    ))
  }

  const slug = post._meta?.slug ?? post.slug ?? ''

  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-sm mx-5 sm:mx-auto">
      <div className="mb-3 flex flex-wrap gap-2">
        {renderPostBadge()}
      </div>

      <h2 className="text-xl md:text-2xl font-semibold leading-snug mb-2 cursor-pointer">
        <Link href={`/blog/post/${slug}`}>
          {post.title}
        </Link>
      </h2>

      <div className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-zinc-300 mb-3">
        {post.description ? post.description : noDescription()}
      </div>

      {post.date && (
        <time dateTime={post.date} className="block text-sm text-gray-500 dark:text-zinc-400">
					{safeFormatDate(post.date as any)}
        </time>
      )}
    </div>
  )
}
