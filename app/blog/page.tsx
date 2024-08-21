'use client'
import PostCard from '@/components/PostCard'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import { Skeleton } from '@/components/ui/skeleton'
import localFont from 'next/font/local'
import { articleProps, decryptJson } from '@/utils/helper'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import HeaderBrand from '@/components/HeaderBrand'
import { useGlitch, GlitchHandle } from 'react-powerglitch'

const interFont = localFont({ src: '../fonts/Inter-VariableFont.ttf' })

const renderSkeleton = (loop: number) => {
  const skeletonElements = [];

  for (let index = 0; index < loop; index++) {
    skeletonElements.push(
      <div key={index} className="mb-8 mx-5 sm:mx-auto">
        <Skeleton className="h-[28px] w-[60px] mb-2" />
        <Skeleton className="h-[16px] w-[120px] mb-2"/>
        <Skeleton className="h-[60px] w-full"/>
      </div>
    );

    // Check if it's the last iteration
    if (index === loop - 1) {
      skeletonElements.push(
        <div key={`last-${index}`} className='flex justify-center'>
          <Skeleton className="h-[36px] w-[305px]"/>
        </div>
      );
    }
  }

  return <>
    <div className={`mx-auto max-w-xl py-0 sm:py-8 relative ${interFont.className}`}>
      <TopNav />
      {skeletonElements}
      <BottomNav />
    </div>
  </>;
}

const getArticles = async () => {
  const res = await axios.get('/api/articles')
  return res.data
}

export default function BlogClient() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ['getArticles'],
    queryFn: getArticles
  })

  const searchParams = useSearchParams()
  const page = searchParams?.get("page")
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const listArticle = JSON.parse(decryptJson(data))
  const postsPerPage = 6
  const totalPost = listArticle?.length
  const totalPages = Math.ceil(totalPost / postsPerPage)
  const glitch: GlitchHandle = useGlitch({ playMode: 'hover' })

  useEffect(() => {
    router.prefetch('/disclaimer')
    router.prefetch('/privacy_policy')
    router.prefetch('/about')
    router.prefetch('/blog')
  }, [router])

  useEffect(() => {
    if (!isPending && listArticle) {
      setPosts(listArticle.slice(0, postsPerPage))
    }
  }, [data])

  useEffect(() => {
    if (isPending) return

    if (!page) {
      setPosts(listArticle.slice(0, postsPerPage))
      return
    }

    if (!parseInt(page!) || parseInt(page!) > totalPages) {
      router.push('/blog')
      return
    }
    const start = (parseInt(page!) - 1) * postsPerPage
    const end = start + postsPerPage
    setPosts(listArticle.slice(start, end))
  }, [page])

  if (isPending && !listArticle) return renderSkeleton(6)

  // useEffect(() => {
  //   window.onscroll = function () {
  //     var body = document.body; //IE 'quirks'
  //     var document: any = document.documentElement; //IE with doctype
  //     document = (document.clientHeight) ? document : body;

  //     if (document.scrollTop == 0) {
  //         alert("top");
  //     }
  //   }
  // }, [])

  const renderContents = () => <>
    {renderPosts()}
    {renderPagination()}
  </>

  const renderPosts = () => {
    return posts.map((post: articleProps, index: number) => {
      return (
        <PostCard key={index} {...post} />
      )
    })
  }

  const renderPagination = () => {
    return <Pagination
      totalPages={totalPages}
      currentPage={page ? parseInt(page) : 1}
    />
  }

  return (
    <div className={`mx-auto max-w-xl py-0 sm:py-8 relative ${interFont.className}`}>
      <TopNav />
      <HeaderBrand ref={glitch.ref} hideOnMobile={true} />
      {renderContents()}
      <BottomNav />
    </div>
  )
}