import { createReader } from '@keystatic/core/reader'
import { DocumentRenderer } from '@keystatic/core/renderer'
import keystaticConfig from '@/keystatic.config'
import React from 'react'
import { removeDraftPhase2 } from '@/lib/utils'

export default async function page() {
  const reader = createReader(process.cwd(), keystaticConfig)
  const datas = await reader.collections.posts.all()
  const cleanedFromDraft = removeDraftPhase2(datas)
  const singlePost = await reader.collections.posts.read('first-post')
  if (!singlePost) return <h1>Empty!</h1>

  return (
    <>
      {/* <p>{JSON.stringify(cleanedFromDraft)}</p> */}
      <p>{JSON.stringify(singlePost)}</p>
      <div className='prose'>
        <DocumentRenderer document={await singlePost.content()} />
      </div>
    </>
  )
}
