import Giscus from '@giscus/react'
import { useTheme } from 'next-themes'

export default function BlogComments() {
  const { theme } = useTheme()

  return (
    <div className='mt-8'>
      <Giscus
        id="comments"
        repo="yvza/blog.comments"
        repoId="MDEwOlJlcG9zaXRvcnkyOTI0OTU4OTQ="
        category="Q&A"
        categoryId="DIC_kwDOEW8iFs4Cbs0K"
        mapping="pathname"
        term="Welcome :)"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme == 'light' ? 'light_tritanopia' : 'dark'}
        lang="en"
        loading="lazy"
      />
    </div>
  )
}