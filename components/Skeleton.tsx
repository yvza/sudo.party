import { Skeleton } from "./ui/skeleton"
import TopNav from "./TopNav"
import BottomNav from "./BottomNav"
import { interFont } from "@/utils/fonts"

export const skeletonBlog = (loop: number) => {
  const skeletonElements = []

  for (let index = 0; index < loop; index++) {
    skeletonElements.push(
      <div key={index} className="mb-8 mx-5 sm:mx-auto">
        <Skeleton className="h-[16px] w-[30px] mb-2" />
        <Skeleton className="h-[28px] w-[90px] mb-2" />
        <Skeleton className="h-[60px] w-full mb-2"/>
        <Skeleton className="h-[16px] w-[120px]"/>
      </div>
    )

    if (index === loop - 1) {
      skeletonElements.push(
        <div key={`last-${index}`} className='flex justify-center'>
          <Skeleton className="h-[36px] w-[305px]"/>
        </div>
      )
    }
  }

  return (
    <>
      <TopNav />
      <div className={`mx-auto max-w-xl py-0 sm:py-8 relative ${interFont.className}`}>
        {skeletonElements}
      </div>
      <BottomNav />
    </>
  )
}

export const skeletonBlogPost = () => (
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