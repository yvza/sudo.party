'use client'
import { allPosts, Post } from 'contentlayer/generated'
import { displayPosts } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import { useUnicorn } from '@/lib/hooks/dummy'
import { useEffect, useState } from 'react'
import { compareDesc } from 'date-fns'
import { useSearchParams, useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'

const sortedPost: Post[] = allPosts.sort((a: Post, b: Post) =>
  compareDesc(new Date(a.date), new Date(b.date))
)

const totalPost = sortedPost.length
const postsPerPage = 2;
const totalPages = Math.ceil(totalPost / postsPerPage)

export default function Home() {
  const searchParams = useSearchParams()
  const page = searchParams?.get("page")
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (page) {
      if (!parseInt(page) || parseInt(page) > totalPages) {
        router.push('/posts')
        return
      }
      const start = (parseInt(page) - 1) * postsPerPage
      const end = start + postsPerPage
      setPosts(sortedPost.slice(start, end))
    } else {
      setPosts(sortedPost.slice(0, postsPerPage))
    }
  }, [page])

  // const posts = displayPosts(allPosts)
  const { data, loading, error } = useUnicorn();

  // useEffect(() => {
  //   console.log(data, loading, error)
  // }, [data, loading, error]);

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="mb-8 text-center text-2xl font-black">sudo.party</h1>
      {posts.map((post, idx) => (
        <PostCard key={idx} {...post} />
      ))}
      <Pagination
        totalPages={totalPages}
        currentPage={page ? parseInt(page) : 1}
      />
    </div>
  )
}