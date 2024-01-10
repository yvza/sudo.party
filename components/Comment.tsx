import { Giscus, GiscusProps } from 'pliny/comments/Giscus';

const config = {
    giscusConfig: {
      repo: 'yvza/blog.comments',
      repositoryId: 'MDEwOlJlcG9zaXRvcnkyOTI0OTU4OTQ=',
      category: 'Q&A',
      categoryId: 'DIC_kwDOEW8iFs4Cbs0K',
      mapping: 'pathname',
      reactions: '1',
      // Send discussion metadata periodically to the parent window: 1 = enable / 0 = disable
      metadata: '0',
      theme: 'light',
      // theme when dark mode
      darkTheme: 'light_protanopia',
      // If the theme option above is set to 'custom`
      // please provide a link below to your custom theme css file.
      // example: https://giscus.app/themes/custom_example.css
      themeURL: '',
      lang: 'en',
    },
}

export default function BlogComments(props: GiscusProps) {
  return (
    <Giscus {...config.giscusConfig} {...props} />
  )
}