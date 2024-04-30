'use client'
import { allPosts, Post } from 'contentlayer/generated'
import { displayPosts } from '@/lib/utils'
import PostCard from '@/components/PostCard'
// import { useUnicorn } from '@/lib/hooks/dummy'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import TopNav from '@/components/TopNav'
import BottomNav from '@/components/BottomNav'
import HeaderBrand from '@/components/HeaderBrand'
import { Skeleton } from '@/components/ui/skeleton'
import { RiArrowUpCircleFill } from '@remixicon/react'
import localFont from 'next/font/local'

const interFont = localFont({ src: '../fonts/Inter-VariableFont.ttf' })
const sortedPost = displayPosts(allPosts)
const totalPost = sortedPost.length
const postsPerPage = 6;
const totalPages = Math.ceil(totalPost / postsPerPage)

export default function Home() {
  const searchParams = useSearchParams()
  const page = searchParams?.get("page")
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [backToTop, setBackToTop] = useState()

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

  // const posts = displayPosts(allPosts)
  // const { data, loading, error } = useUnicorn();

  // useEffect(() => {
  //   console.log(data, loading, error)
  // }, [data, loading, error]);
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

    return <>{skeletonElements}</>;
  }

  const renderContents = () => {
    if (posts.length === 0) return renderSkeleton(6)
    // if (posts.length === 0) return <>Fetching data</>

    return <>
      {renderPosts()}
      {renderPagination()}
    </>
  }

  const renderPosts = () => {
    return posts.map((post, idx) => (
      <PostCard key={idx} {...post} />
    ))
  }

  const renderPagination = () => {
    return <Pagination
      totalPages={totalPages}
      currentPage={page ? parseInt(page) : 1}
    />
  }

  return (
    <div className={`mx-auto max-w-xl py-8 relative ${interFont.className}`}>
      <TopNav />
      <HeaderBrand />
      {renderContents()}
      <BottomNav />

      {backToTop && (
        <RiArrowUpCircleFill
          size={36}
          className='hover:cursor-pointer fixed mb-8 mr-5 bottom-0 right-0'
        />
      )}
    </div>
  )
}