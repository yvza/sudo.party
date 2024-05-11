import React from 'react'
import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '@/keystatic.config'
import { DocumentRenderer } from '@keystatic/core/renderer'

interface ServerComponentProps {
  params: { slug: string }
}

export default async function ServerComponent({ params }: ServerComponentProps) {
  const reader = createReader(process.cwd(), keystaticConfig)
  const singlePost = await reader.collections.posts.read(params.slug)

  return (
    <div className='prose'>
      <DocumentRenderer document={await singlePost!.content()} />
    </div>
  )
}
