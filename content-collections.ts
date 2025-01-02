import { defineCollection, defineConfig } from '@content-collections/core'
import { compileMDX } from '@content-collections/mdx'

const posts = defineCollection({
  name: "posts",
  directory: "posts",
  include: "**/*.md",
  schema: (z) => ({
    title: z.string(),
    date: z.string(),
    draft: z.boolean(),
    visibility: z.string(),
    membership: z.any().optional(), // sudopartypass | sgbcode | can be empty
    description: z.any().optional(),
    label: z.string() // exploit | how to | news | cyber security
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document)
    return {
      ...document,
      mdx
    }
  }
});

export default defineConfig({
  collections: [posts],
});