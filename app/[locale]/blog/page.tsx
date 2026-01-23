import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import PostCard from '@/components/PostCard'
import Pagination from '@/components/Pagination'
import { interFont } from '@/utils/fonts'
import { getArticlesServer } from '@/lib/server/articles'
import { getTranslations } from 'next-intl/server'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const limit = 6
  const t = await getTranslations({ locale, namespace: 'blog' })

  const { total, data } = await getArticlesServer({ page, limit, locale })
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isNoPostFound = data.length === 0

  return (
    <>
      <TopNav />
      <div className={`mx-auto max-w-xl py-8 relative ${interFont.className}`}>
        {isNoPostFound ? (
          <div className="p-4 text-sm text-zinc-500 text-center">{t('noResults')}</div>
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
