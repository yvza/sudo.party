import Giscus from '@giscus/react';

export default function BlogComments() {
  return (
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
      theme="light_tritanopia"
      lang="en"
      loading="lazy"
    />
  )
}