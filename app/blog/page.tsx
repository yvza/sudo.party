'use client'
import PostCard from '@/components/PostCard'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import { articleProps, decryptJson } from '@/utils/helper'
import { useGlitch, GlitchHandle } from 'react-powerglitch'
import { useArticles } from '@/services/articles'
import { skeletonBlog } from '@/components/Skeleton'
import { interFont } from '@/utils/fonts'

export default function BlogClient() {
  const { isPending, error, data } = useArticles()
  const searchParams = useSearchParams()
  const page = searchParams?.get("page")
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const listArticle = useRef([])
  const postsPerPage = 6
  const totalPost = listArticle.current ? listArticle.current.length : 0
  const totalPages = Math.ceil(totalPost / postsPerPage)
  const glitch: GlitchHandle = useGlitch({ playMode: 'hover' })

  useEffect(() => {
    router.prefetch('/disclaimer')
    router.prefetch('/privacy_policy')
    router.prefetch('/about')
    router.prefetch('/blog')
  }, [router])

  useEffect(() => {
    if (data) listArticle.current = JSON.parse(decryptJson(Buffer.from(data.data).toString()))

    if (!isPending && listArticle.current) {
      setPosts(listArticle.current.slice(0, postsPerPage))
    }
  }, [data])

  useEffect(() => {
    if (isPending) return

    if (!page) {
      setPosts(listArticle.current.slice(0, postsPerPage))
      return
    }

    if (!parseInt(page!) || parseInt(page!) > totalPages) {
      router.push('/blog')
      return
    }
    const start = (parseInt(page!) - 1) * postsPerPage
    const end = start + postsPerPage
    setPosts(listArticle.current.slice(start, end))
  }, [page])

  if (isPending) return skeletonBlog(6)

  const renderContents = () => <>
    <div className={`mx-auto max-w-xl py-0 py-8 relative ${interFont.className}`}>
      {renderPosts()}
      {!error && renderPagination()}
    </div>
  </>

  const renderPosts = () => {
    if (error) return <div>Error fetching data, try again later.</div>
    return posts.map((post: articleProps, index: number) => <PostCard key={index} {...post} />)
  }

  const renderPagination = () => {
    return <Pagination
      totalPages={totalPages}
      currentPage={page ? parseInt(page) : 1}
    />
  }

  return (
    <>
      <TopNav />
      {renderContents()}
      <BottomNav />
    </>
  )
}