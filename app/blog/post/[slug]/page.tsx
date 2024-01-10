'use client'

import { format, parseISO } from 'date-fns'
import { allPosts } from 'contentlayer/generated'
import BlogComments from '@/components/Comment'
import { redirect } from 'next/navigation'
import { shouldILogin, displaySinglePost } from '@/lib/utils'
import Dialog from '@/components/Dialog'
import MockingFakeContent from '@/components/MockingFakeContent'
import { useRouter } from 'next/navigation'

const DisplayPostLayout = ({ params }: { params: { slug: string } }) => {
  const post = displaySinglePost(allPosts, params.slug)
  const router = useRouter()

  if (!post) redirect('/oops')

  if (shouldILogin(post.visibility)) {
    return (
      <div>
        <Dialog
          show
          title='Require access pass'
          description='Lets authenticate first!'
          onCancel={() => { router.back() }}
          onAction={() => { router.push('/auth') } } />

        <article className="mx-auto max-w-xl py-8">
          <div className="mb-8 text-center">
            <time dateTime={post.date} className="mb-1 text-xs text-gray-600">
              {format(parseISO(post.date), 'LLLL d, yyyy')}
            </time>
            <h1 className="text-3xl font-bold">{post.title}</h1>
          </div>
          <MockingFakeContent content={post.body.html} />
        </article>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-xl py-8">
      <div className="mb-8 text-center">
        <time dateTime={post.date} className="mb-1 text-xs text-gray-600">
          {format(parseISO(post.date), 'LLLL d, yyyy')}
        </time>
        <h1 className="text-3xl font-bold">{post.title}</h1>
      </div>
      <div className="[&>*]:mb-3 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: post.body.html }} />
      <BlogComments />
    </article>
  )
}

export default DisplayPostLayout