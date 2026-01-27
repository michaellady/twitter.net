import { useState } from 'react'

const MAX_CHARS = 140

interface TweetComposerProps {
  onSubmit: (content: string) => Promise<void>
}

export function TweetComposer({ onSubmit }: TweetComposerProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const charCount = content.length
  const isEmpty = charCount === 0
  const isOverLimit = charCount > MAX_CHARS
  const isDisabled = isEmpty || isOverLimit || isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDisabled) return

    setIsSubmitting(true)
    try {
      await onSubmit(content)
      setContent('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
        rows={3}
        data-testid="tweet-input"
      />
      <div className="flex justify-between items-center mt-2">
        <span
          className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}
          data-testid="char-count"
        >
          {charCount}/{MAX_CHARS}
        </span>
        <button
          type="submit"
          disabled={isDisabled}
          className="px-4 py-2 bg-blue-500 text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
          data-testid="tweet-button"
        >
          Tweet
        </button>
      </div>
    </form>
  )
}
