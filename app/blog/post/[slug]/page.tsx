'use client'

import { format, parseISO } from 'date-fns'
import BlogComments from '@/components/Comment'
import { articleProps, decryptJson, searchBySlug, shouldILogin } from '@/lib/utils'
import Dialog from '@/components/Dialog'
import { redirect, useRouter } from 'next/navigation'
import useSession from '@/lib/iron-session/session'
import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'
import axios from 'axios'
import { Skeleton } from '@/components/ui/skeleton'
import HeheIDK from '@/components/HeheIDK'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MDXContent } from '@content-collections/mdx/react'
import { useEffect } from 'react'
import Link from 'next/link'

interface PostProps {
  params: { slug: string },
}

const getArticles = async () => {
  const res = await axios.get('/api/articles')
  return res.data
}

export default function ClientComponent({
  params,
}: PostProps) {
  const router = useRouter()
  const { session, isLoading } = useSession()
  const { data, isLoading: isFetchingData, isFetching, error } = useQuery({ queryKey: ['getArticles'], queryFn: getArticles })
  const decrypted = JSON.parse(decryptJson(data as string)) as articleProps[]
  const articleMetadata = searchBySlug(decrypted, params.slug)

  useEffect(() => {
    router.prefetch('/blog')
    router.prefetch('/auth')
  }, [router])

  const renderSkeleton = () => <>
    <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
      <TopNav />
      <div className='mx-5 sm:mx-auto'>
        <div className='mb-8 flex flex-col'>
          <Skeleton className="h-[26px] w-full mb-2" />
          <div className="flex justify-between">
          <Skeleton className="h-[18px] w-[60px] mb-2" />
          <Skeleton className="h-[18px] w-[60px] mb-2" />
          </div>
        </div>
        <Skeleton className='h-[576px] w-full' />
        <BottomNav />
      </div>
    </div>
  </>

  if (isLoading || isFetchingData) return renderSkeleton()

  if (!articleMetadata) redirect('/oops')

  // if (!isProd) console.log(shouldILogin(post!.visibility), (!session.isLoggedIn && !isLoading))
  // if (!isProd) console.log(post)

  if (shouldILogin(articleMetadata.visibility) && (!session.isLoggedIn && !isLoading)) {
    return (
      <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
        <Dialog
          show
          title='Require access pass'
          description='Lets authenticate first!'
          onCancel={() => { router.push('/blog') }}
          onAction={() => { router.push('/auth') } } />

        <TopNav />
        <div className="mx-5 sm:mx-auto mb-8">
          <h1 className="text-2xl font-bold">{articleMetadata.title}</h1>
          <div className='flex justify-between mt-2'>
            <time dateTime={articleMetadata.date} className="mb-1 text-xs dark:text-zinc-500">
              {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
            </time>
            <Link href="/blog" className='text-xs border-b border-dotted border-black dark:border-white dark:text-zinc-500 dark:hover:text-zinc-200/80'>Back</Link>
          </div>
        </div>
        <HeheIDK />
        <BottomNav />
      </div>
    )
  }

  // make a another popup when isLoggedIn && membership
  if (session.isLoggedIn && articleMetadata.membership == 'sudopartypass' && session.type == 'sgbcode') {
    return (
      <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
        <Dialog
          show
          title='SGB Code can&apos;t access this article'
          description='You need to switch access key'
          onCancel={() => { router.push('/blog') }}
          onAction={async () => {
            // we need to clear session and redirect back to auth
            await axios.delete('/api/auth')
            router.push('/auth')
          } } />

        <TopNav />
        <div className="mx-5 sm:mx-auto mb-8">
          <h1 className="text-2xl font-bold">{articleMetadata.title}</h1>
          <div className='flex justify-between mt-2'>
            <time dateTime={articleMetadata.date} className="mb-1 text-xs dark:text-zinc-500">
              {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
            </time>
            <Link href="/blog" className='text-xs border-b border-dotted border-black dark:border-white dark:text-zinc-500 dark:hover:text-zinc-200/80'>Back</Link>
          </div>
        </div>
        <HeheIDK />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="max-w-xl py-0 sm:py-8 sm:mx-auto">
      <TopNav />
      <div className="mx-5 sm:mx-auto mb-8">
        <h1 className="text-2xl font-bold">{articleMetadata.title}</h1>
        <div className='flex justify-between mt-2'>
          <time dateTime={articleMetadata.date} className="mb-1 text-xs dark:text-zinc-500">
            {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
          </time>
          <Link href="/blog" className='text-xs border-b border-dotted border-black dark:border-white dark:text-zinc-500 dark:hover:text-zinc-200/80'>Back</Link>
        </div>
      </div>
      <div className='mx-5 sm:mx-auto'>
        <article className='prose'>
          <MDXContent code={articleMetadata.mdx}/>
        </article>
        <BlogComments />
      </div>
      <BottomNav />
    </div>
  )
}