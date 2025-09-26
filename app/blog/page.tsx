import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import PostCard from '@/components/PostCard'
import Pagination from '@/components/Pagination'
import { interFont } from '@/utils/fonts'
import { getArticlesServer } from '@/lib/server/articles'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const limit = 6

  const { total, data } = await getArticlesServer({ page, limit })
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isNoPostFound = data.length === 0

  return (
    <>
      <TopNav />
      <div className={`mx-auto max-w-xl py-8 relative ${interFont.className}`}>
        {isNoPostFound ? (
          <div className="p-4 text-sm text-zinc-500 text-center">No posts found.</div>
        ) : (
          data.map((article: any, i: number) => (
            <PostCard key={article.slug ?? article._meta?.slug ?? i} {...article} />
          ))
        )}

        <div className="my-8">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            isNoPostFound={isNoPostFound}
          />
        </div>
      </div>
      <BottomNav />
    </>
  )
}
