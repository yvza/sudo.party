import React from 'react'
import Link from 'next/link'
import { displayDateTime, postPhase2 } from '@/lib/utils'

export default function PostCard(post: postPhase2) {
	const noDescription = () => <em>No description provided.</em>

	return (
		<div className="mb-8 mx-5 sm:mx-auto">
			<h2 className="text-lg md:text-xl font-medium mb-2 cursor-pointer">
				<Link href={`/blog/post/${post.slug}`}>
						{post.entry.title}
				</Link>
			</h2>
			<time dateTime={post.entry.date} className="mb-2 block text-xs text-gray-600">
				{displayDateTime(post.entry.date)}
			</time>
			<div className="text-sm [&>*]:mb-3 [&>*:last-child]:mb-0 text-justify">
				{post.entry.description !== '' ? post.entry.description : noDescription()}
			</div>
		</div>
	)
}
