import React from 'react'
import Link from 'next/link'
import { Post } from 'contentlayer/generated'
import { displayDateTime } from '@/lib/utils'
import { isProd } from '@/config'

export default function PostCard(post: Post) {
	const urlPath = (url: string) => {
			let parts = url.split('/');
			parts[1] = 'post';
			const rewrittenUrl = parts.join('/');
			return `/blog${rewrittenUrl}`;
	}

	if (!isProd) console.log(post)
	const noDescription = () => <em>No description provided.</em>

	return (
		<div className="mb-8 mx-5 sm:mx-auto">
			<h2 className="mb-1 text-lg md:text-xl font-medium mb-2 cursor-pointer">
				<Link href={urlPath(post.url)}>
						{post.title}
				</Link>
			</h2>
			<time dateTime={post.date} className="mb-2 block text-xs text-gray-600">
				{displayDateTime(post.date)}
			</time>
			<div className="text-sm [&>*]:mb-3 [&>*:last-child]:mb-0 text-justify">
				{post.description ?? noDescription()}
			</div>
		</div>
	)
}
