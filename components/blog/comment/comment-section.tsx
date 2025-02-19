import { useState } from 'react'
import { CommentForm } from './comment-form'
import { CommentList } from './comment-list'

interface Comment {
  id: number
  author: string
  content: string
  createdAt: Date
}

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: 'John Doe',
      content: 'This is a great article! Thanks for sharing.',
      createdAt: new Date('2023-05-15T10:30:00'),
    },
    {
      id: 2,
      author: 'Jane Smith',
      content: 'I learned a lot from this. Looking forward to more content like this.',
      createdAt: new Date('2023-05-15T11:45:00'),
    },
  ])

  const addComment = (author: string, content: string) => {
    const newComment: Comment = {
      id: comments.length + 1,
      author,
      content,
      createdAt: new Date(),
    }
    setComments([...comments, newComment])
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      <CommentForm onSubmit={addComment} />
      <CommentList comments={comments} />
    </div>
  )
}

