import React, { memo } from 'react'
import { Skeleton } from "./ui/skeleton"
import TopNav from "./TopNav"
import BottomNav from "./BottomNav"
import { interFont } from "@/utils/fonts"

// Memoized skeleton item to prevent re-creation
const SkeletonItem = memo(function SkeletonItem({ index, isLast }: { index: number; isLast: boolean }) {
  return (
    <>
      <div className="mb-8 mx-5 sm:mx-auto">
        <Skeleton className="h-[16px] w-[30px] mb-2" />
        <Skeleton className="h-[28px] w-[90px] mb-2" />
        <Skeleton className="h-[60px] w-full mb-2"/>
        <Skeleton className="h-[16px] w-[120px]"/>
      </div>
      {isLast && (
        <div className='flex justify-center'>
          <Skeleton className="h-[36px] w-[305px]"/>
        </div>
      )}
    </>
  )
})

// Convert to memoized component for better performance
export const SkeletonBlog = memo(function SkeletonBlog({ count }: { count: number }) {
  return (
    <>
      <TopNav />
      <div className={`mx-auto max-w-xl py-0 sm:py-8 relative ${interFont.className}`}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonItem key={i} index={i} isLast={i === count - 1} />
        ))}
      </div>
      <BottomNav />
    </>
  )
})

// Keep legacy function for backward compatibility
export const skeletonBlog = (loop: number) => <SkeletonBlog count={loop} />

export const SkeletonBlogPost = memo(function SkeletonBlogPost() {
  return (
    <>
      <TopNav />
      <div className='max-w-xl py-0 sm:py-8 sm:mx-auto'>
        <div className='mx-5 sm:mx-auto'>
          <div className='mb-8 flex flex-col'>
            <Skeleton className="h-[46px] w-full mb-2" />
            <div className="flex justify-between">
            <Skeleton className="h-[18px] w-[60px] mb-2" />
            <Skeleton className="h-[18px] w-[60px] mb-2" />
            </div>
          </div>
          <Skeleton className='h-[576px] w-full' />
        </div>
      </div>
      <BottomNav />
    </>
  )
})

// Keep legacy function for backward compatibility
export const skeletonBlogPost = () => <SkeletonBlogPost />