import React from 'react'
import Link from 'next/link'
import { Post } from 'contentlayer/generated'
import { displayDateTime } from '@/lib/utils'

export default function PostCard(post: Post) {
	const urlPath = (url: string) => {
			let parts = url.split('/');
			parts[1] = 'post';
			const rewrittenUrl = parts.join('/');
			return `/blog${rewrittenUrl}`;
	}

	return (
		<div className="mb-8">
			<h2 className="mb-1 text-xl">
				<Link href={urlPath(post.url)} className="text-blue-700 hover:text-blue-900 dark:text-blue-400">
						{post.title}
				</Link>
			</h2>
			<time dateTime={post.date} className="mb-2 block text-xs text-gray-600">
				{displayDateTime(post.date)}
			</time>
			<div className="text-sm [&>*]:mb-3 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: post.body.html }} />
		</div>
	)
}
