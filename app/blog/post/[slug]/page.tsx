'use client'

import { format, parseISO } from 'date-fns'
import { allPosts } from 'contentlayer/generated'
import BlogComments from '@/components/Comment'
import { redirect } from 'next/navigation'
import { shouldILogin, displaySinglePost, removeImgFromMarkdown } from '@/lib/utils'
import Dialog from '@/components/Dialog'
import MockingFakeContent from '@/components/MockingFakeContent'
import { useRouter } from 'next/navigation'
import useSession from '@/lib/iron-session/session'
import Markdown from "markdown-to-jsx";
import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'
import { isProd } from '@/config'
import axios from 'axios'
import { Skeleton } from '@/components/ui/skeleton'

const DisplayPostLayout = ({ params }: { params: { slug: string } }) => {
  const post = displaySinglePost(allPosts, params.slug)
  const router = useRouter()
  const { session, isLoading } = useSession()

  const renderSkeleton = () => {
    return <>
      <div className='max-w-xl py-8 mx-5 text-justify sm:mx-auto'>
        <TopNav />
        <div className='mb-8 flex flex-col items-center'>
          <Skeleton className="h-[16px] w-[120px] mb-2"/>
          <Skeleton className="h-[36px] w-[60px] mb-2" />
        </div>
        <Skeleton className='h-[576px] w-full'/>
        <BottomNav />
      </div>
    </>
  }

  if (!post) redirect('/oops')

  if (isLoading) return renderSkeleton()

  // if (!isProd) console.log(shouldILogin(post!.visibility), (!session.isLoggedIn && !isLoading))
  if (!isProd) console.log(post)

  if (shouldILogin(post!.visibility) && (!session.isLoggedIn && !isLoading)) {
    return (
      <div className='max-w-xl py-8 mx-5 text-justify sm:mx-auto'>
        <Dialog
          show
          title='Require access pass'
          description='Lets authenticate first!'
          onCancel={() => { router.back() }}
          onAction={() => { router.push('/auth') } } />

        <TopNav />
        <article className="mb-8 text-center">
          <time dateTime={post!.date} className="mb-1 text-xs text-gray-600">
            {format(parseISO(post!.date), 'LLLL d, yyyy')}
          </time>
          <h1 className="text-3xl font-bold">{post!.title}</h1>
        </article>
        <MockingFakeContent content={removeImgFromMarkdown(post!.body.raw)} />
        <BottomNav />
      </div>
    )
  }

  // make a another popup when isLoggedIn && membership
  if (session.isLoggedIn && post.membership == 'sudopartypass' && session.type == 'sgbcode') {
    return (
      <div className='max-w-xl py-8 mx-5 text-justify sm:mx-auto'>
        <Dialog
          show
          title='SGB Code can&apos;t access this article'
          description='You need to switch access key'
          onCancel={() => { router.back() }}
          onAction={async () => {
            // we need to clear session and redirect back to auth
            await axios.delete('/api/auth')
            router.push('/auth')
          } } />

        <TopNav />
        <article className="mb-8 text-center">
          <time dateTime={post!.date} className="mb-1 text-xs text-gray-600">
            {format(parseISO(post!.date), 'LLLL d, yyyy')}
          </time>
          <h1 className="text-3xl font-bold">{post!.title}</h1>
        </article>
        <MockingFakeContent content={removeImgFromMarkdown(post!.body.raw)} />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="max-w-xl py-8 mx-5 text-justify sm:mx-auto">
      <TopNav />
      <div className="mb-8 text-center">
        <time dateTime={post!.date} className="mb-1 text-xs text-gray-600">
          {format(parseISO(post!.date), 'LLLL d, yyyy')}
        </time>
        <h1 className="text-3xl font-bold">{post!.title}</h1>
      </div>
      <div className='prose'>
        <Markdown>{post.body.raw}</Markdown>
      </div>
      <BlogComments />
      <BottomNav />
    </div>
  )
}

export default DisplayPostLayout