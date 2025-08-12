'use client'

import PostCard from '@/components/PostCard'
import { useSearchParams } from 'next/navigation'
import Pagination from '@/components/Pagination'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import { useArticles } from '@/services/articles'
import { skeletonBlog } from '@/components/Skeleton'
import { interFont } from '@/utils/fonts'

export default function ClientList({ initialPage = 1 }: { initialPage?: number }) {
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams?.get('page') ?? initialPage))
  const limit = 6

  const { isPending, error, data } = useArticles({ page, limit })
  const posts = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (isPending) return skeletonBlog(limit)

  return (
    <>
      <TopNav />
        <div className={`mx-auto max-w-xl py-8 relative ${interFont.className}`}>
          {error ? (
            <div className="p-4 text-sm text-red-500">Failed to load articles</div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">No posts found.</div>
          ) : (
            <>
              {posts.map((article: any, i: number) => (
                <PostCard key={article.slug ?? article._meta?.slug ?? i} {...article} />
              ))}
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
