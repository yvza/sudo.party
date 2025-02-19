import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface CommentFormProps {
  onSubmit: (author: string, content: string) => void
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (author.trim() && content.trim()) {
      onSubmit(author, content)
      setAuthor('')
      setContent('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <Textarea
          placeholder="Write your comment here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <Button type="submit">Send</Button>
    </form>
  )
}

