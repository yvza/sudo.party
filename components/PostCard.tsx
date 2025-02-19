import React from 'react'
import Link from 'next/link'
import { articleProps, displayDateTime } from '@/utils/helper'
import { Badge } from './ui/badge'

export default function PostCard(post: articleProps) {
	const noDescription = () => <em>No description provided.</em>
	const renderPostBadge = () => {
		const label = post.label.split(',')
		if (label.length > 0) {
			return label.map((item, index) => {
				const trimmedItem = item.trim()
				return(
					<Badge key={index} variant={trimmedItem}>{item}</Badge>
				)
			})
		}
	}

	return (
		<div className="mb-8 mx-5 sm:mx-auto">
			<div className='flex gap-1 mb-2'>
				{renderPostBadge()}
			</div>
			<h2 className="text-lg md:text-xl font-medium mb-2 cursor-pointer">
				<Link href={`/blog/post/${post._meta.path}`}>
					{post.title}
				</Link>
			</h2>
			<div className="text-sm *:mb-3 [&>*:last-child]:mb-0 text-justify mb-2 text-slate-600 dark:text-slate-400">
				{post.description ? post.description : noDescription()}
			</div>
			<time dateTime={post.date} className="block font-medium text-xs text-slate-900 dark:text-white">
				{displayDateTime(post.date)}
			</time>
		</div>
	)
}
