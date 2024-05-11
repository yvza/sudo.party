import BlogClient from "./client";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";
import { removeDraftPhase2 } from "@/lib/utils";

export default async function Blog() {
  const reader = createReader(process.cwd(), keystaticConfig)
  const collectedData = await reader.collections.posts.all()
  const cleanedFromDraft = removeDraftPhase2(collectedData)
  const articles = JSON.stringify(cleanedFromDraft)

  return (
    <BlogClient articles={articles}/>
  )
}