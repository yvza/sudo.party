'use client'

import PostCard from '@/components/PostCard'
import { useSearchParams } from 'next/navigation'
import Pagination from '@/components/Pagination'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import { useArticles } from '@/services/articles'
import { skeletonBlog } from '@/components/Skeleton'
import { interFont } from '@/utils/fonts'

export default function BlogClient() {
  const searchParams = useSearchParams()

  // read page from URL and clamp to >= 1
  const pageParam = Number(searchParams?.get('page') ?? 1)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  // keep this in sync with API default/expectations
  const limit = 6

  const { isPending, error, data } = useArticles({ page, limit })

  const posts = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const renderPosts = () =>
    posts.map((article: any, index: number) => (
      <PostCard key={article.slug ?? article._meta?.slug ?? index} {...article} />
    ))

  if (isPending) return skeletonBlog(limit)

  return (
    <>
      <TopNav />
      <div className={`mx-auto max-w-xl py-8 relative ${interFont.className}`}>
        {error ? (
          <div className="p-4 text-sm text-red-500">Failed to load articles</div>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="p-4 text-sm text-zinc-500">No posts found.</div>
            ) : (
              renderPosts()
            )}

            <div className="my-8">
              <Pagination totalPages={totalPages} currentPage={page} />
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  )
}
