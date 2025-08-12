import Client from "./client";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return <Client slug={slug} />
}
