import type { Tweet as TweetType } from '../types'

interface TweetProps {
  tweet: TweetType
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return `${diffDays}d ago`
  }
}

export function Tweet({ tweet }: TweetProps) {
  return (
    <article className="p-4 border-b border-gray-200" data-testid="tweet">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold" data-testid="tweet-user">
          {tweet.userId}
        </span>
        <span className="text-gray-500" data-testid="tweet-timestamp">
          {formatRelativeTime(tweet.createdAt)}
        </span>
      </div>
      <p className="text-gray-900" data-testid="tweet-content">
        {tweet.content}
      </p>
      {tweet.imageUrl && (
        <img
          src={tweet.imageUrl}
          alt="Tweet image"
          className="mt-2 rounded-lg max-w-full max-h-96 object-contain"
          data-testid="tweet-image"
        />
      )}
    </article>
  )
}
