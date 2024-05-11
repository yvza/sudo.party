import ClientComponent from "./client";
import ServerComponent from "./server";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import { redirect } from "next/navigation";
interface PostProps {
  params: { slug: string },
}

export default async function Post({
  params,
}: PostProps) {
  const reader = createReader(process.cwd(), keystaticConfig)
  const singlePost = await reader.collections.posts.read(params.slug)

  if (!singlePost) redirect('/oops')

  const metadata = JSON.stringify(singlePost)

  return (
    <ClientComponent metadata={metadata}>
      <ServerComponent params={params} />
    </ClientComponent>
  )
}

// export async function generateStaticParams() {
//   const reader = createReader(process.cwd(), keystaticConfig)
//   const postSlug = await reader.collections.posts.list()
//   return postSlug.map((postSlug) => ({ slug: postSlug }))
// }