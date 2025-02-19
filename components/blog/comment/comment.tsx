interface CommentProps {
  author: string
  content: string
  createdAt: Date
}

export function Comment({ author, content, createdAt }: CommentProps) {
  return (
    <div className="flex space-x-4 bg-white p-4 rounded-lg shadow">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">{author}</h3>
          <time className="text-xs text-gray-500" dateTime={createdAt.toISOString()}>
            {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
          </time>
        </div>
        <p className="text-sm text-gray-700">{content}</p>
      </div>
    </div>
  )
}

