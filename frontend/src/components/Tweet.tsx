import type { Tweet as TweetType } from '../types'

interface TweetProps {
  tweet: TweetType
  onLike?: (tweetId: string) => void
  onUnlike?: (tweetId: string) => void
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

export function Tweet({ tweet, onLike, onUnlike }: TweetProps) {
  const handleLikeClick = () => {
    if (tweet.isLikedByCurrentUser) {
      onUnlike?.(tweet.id)
    } else {
      onLike?.(tweet.id)
    }
  }

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
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1 text-sm ${
            tweet.isLikedByCurrentUser ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
          data-testid="like-button"
          aria-label={tweet.isLikedByCurrentUser ? 'Unlike' : 'Like'}
        >
          <svg
            className="w-5 h-5"
            fill={tweet.isLikedByCurrentUser ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span data-testid="like-count">{tweet.likeCount}</span>
        </button>
      </div>
    </article>
  )
}
