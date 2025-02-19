import { Comment } from './comment'

interface CommentListProps {
  comments: {
    id: number
    author: string
    content: string
    createdAt: Date
  }[]
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Comment key={comment.id} {...comment} />
      ))}
    </div>
  )
}

