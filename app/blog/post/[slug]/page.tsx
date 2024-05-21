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
    <div className='max-w-xl py-0 sm:py-8 text-justify sm:mx-auto'>
      <TopNav />
      <div className='mx-5'>
        <div className='mb-8 flex flex-col items-center'>
          <Skeleton className="h-[16px] w-[120px] mb-2" />
          <Skeleton className="h-[36px] w-[60px] mb-2" />
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
      <div className='max-w-xl py-0 sm:py-8 text-justify sm:mx-auto'>
        <Dialog
          show
          title='Require access pass'
          description='Lets authenticate first!'
          onCancel={() => { router.push('/blog') }}
          onAction={() => { router.push('/auth') } } />

        <TopNav />
        <article className="mb-8 text-center">
          <time dateTime={articleMetadata.date} className="mb-1 text-xs text-gray-600">
            {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
          </time>
          <h1 className="text-3xl font-bold">{articleMetadata.title}</h1>
        </article>
        <HeheIDK />
        <BottomNav />
      </div>
    )
  }

  // make a another popup when isLoggedIn && membership
  if (session.isLoggedIn && articleMetadata.membership == 'sudopartypass' && session.type == 'sgbcode') {
    return (
      <div className='max-w-xl py-0 sm:py-8 text-justify sm:mx-auto'>
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
        <article className="mb-8 text-center">
          <time dateTime={articleMetadata.date} className="mb-1 text-xs text-gray-600">
            {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
          </time>
          <h1 className="text-3xl font-bold">{articleMetadata.title}</h1>
        </article>
        <HeheIDK />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="max-w-xl py-0 sm:py-8 text-justify sm:mx-auto">
      <TopNav />
      <div className='mx-5'>
        <div className="mb-8 text-center">
          <time dateTime={articleMetadata.date} className="mb-1 text-xs text-gray-600">
            {format(parseISO(articleMetadata.date), 'LLLL d, yyyy')}
          </time>
          <h1 className="text-3xl font-bold">{articleMetadata.title}</h1>
        </div>
        <article className='prose'>
          <MDXContent code={articleMetadata.mdx}/>
        </article>
        <BlogComments />
      </div>
      <BottomNav />
    </div>
  )
}