'use client'
import { format, parseISO } from 'date-fns'
import { articleProps, decryptJson, searchBySlug, shouldILogin } from '@/utils/helper'
import Dialog from '@/components/Dialog'
import { redirect, useRouter } from 'next/navigation'
import useSession from '@/lib/iron-session/session'
import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'
import HeheIDK from '@/components/HeheIDK'
import { useQuery } from '@tanstack/react-query'
import { MDXContent } from '@content-collections/mdx/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { skeletonBlogPost } from '@/components/Skeleton'
import { articleMetadata, PostProps } from '@/types/global'
import { ArticlesProps } from '@/types/global'
import { getArticles } from '@/services/articles'
import { useDispatch } from 'react-redux'
import { showAlertDialog } from '@/lib/features/alertDialog/toggle'
import React from 'react'
import CommentSection from '@/components/blog/comment/comment-section'

export default function ClientComponent({
  params,
}: PostProps) {
  const router = useRouter()
  const { session, isLoading } = useSession()
  const { data, error, isFetched } = useQuery({
    queryKey: ['getArticles'],
    queryFn: getArticles,
    staleTime: 1000 * 60 * 60
  }) as ArticlesProps
  const dispatch = useDispatch()
  const [articleMetadata, setArticleMetadata] = useState<articleMetadata | articleProps>()

  useEffect(() => {
    router.prefetch('/blog')
    router.prefetch('/auth')
  }, [router])

  useEffect(() => {
    if (isFetched && !!data) {
      const decrypted = JSON.parse(decryptJson(Buffer.from(data.data).toString())) as articleProps[]
      const getArticle = searchBySlug(decrypted, params.slug)
      if (!getArticle || error) redirect('/oops')
      setArticleMetadata(getArticle)
    }
  }, [data, isFetched])

  useEffect(() => {
    if (articleMetadata
      && shouldILogin(articleMetadata?.visibility)
      && (!session.isLoggedIn || !isLoading)
    ) {
      dispatch(showAlertDialog({
        show: true,
        title: 'Eyyo',
        description: 'another dialog',
        onAction: () => {
          router.push('/auth')
        },
        onCancel: () => {
          handleCancel()
        }
      }))
    }
  }, [articleMetadata])

  const handleCancel = () => {
    const isDirect = !document.referrer.includes('/blog')
    isDirect ? router.push('/blog') : router.back()
  }

  if (!articleMetadata || isLoading) return skeletonBlogPost()

  if (shouldILogin(articleMetadata!.visibility) && (!session.isLoggedIn && !isLoading)) {
    return (
      <>
        <TopNav />
        <Dialog />
        <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
          <div className="mx-5 sm:mx-auto mb-8">
            <h1 className="text-2xl font-bold">{articleMetadata!.title}</h1>
            <div className='flex justify-between mt-2'>
              <time dateTime={articleMetadata!.date} className="mb-1 text-xs dark:text-zinc-500">
                {format(parseISO(articleMetadata!.date), 'LLLL d, yyyy')}
              </time>
              <Link href="/blog" className='text-xs border-b border-dotted border-black dark:border-white dark:text-zinc-500 dark:hover:text-zinc-200/80'>Back</Link>
            </div>
          </div>
          <HeheIDK />
        </div>
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <TopNav />
      <div className="max-w-xl py-0 sm:py-8 sm:mx-auto">
        <div className="mx-5 sm:mx-auto mb-8">
          <h1 className="text-2xl font-bold">{articleMetadata!.title}</h1>
          <div className='flex justify-between mt-2'>
            <time dateTime={articleMetadata!.date} className="mb-1 text-xs dark:text-zinc-500">
              {format(parseISO(articleMetadata!.date), 'd LLLL, yyyy')}
            </time>
            <Link href="/blog" className='text-xs border-b border-dotted border-black dark:border-white dark:text-zinc-500 dark:hover:text-zinc-200/80'>Back</Link>
          </div>
        </div>
        <div className='mx-5 sm:mx-auto'>
          <article className='prose'>
            <MDXContent code={articleMetadata!.mdx}/>
          </article>
          <CommentSection />
        </div>
      </div>
      <BottomNav />
    </>
  )
}