import type { Tweet as TweetType } from '../types'
import { Tweet } from './Tweet'

interface FeedProps {
  tweets: TweetType[]
  isLoading: boolean
  onLike?: (tweetId: string) => void
  onUnlike?: (tweetId: string) => void
}

export function Feed({ tweets, isLoading, onLike, onUnlike }: FeedProps) {
  return (
    <div data-testid="tweet-feed">
      {isLoading ? (
        <div className="flex justify-center p-8" data-testid="loading-spinner">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : tweets.length === 0 ? (
        <div className="p-8 text-center text-gray-500" data-testid="empty-state">
          No tweets yet. Be the first to tweet!
        </div>
      ) : (
        tweets.map((tweet) => (
          <Tweet key={tweet.id} tweet={tweet} onLike={onLike} onUnlike={onUnlike} />
        ))
      )}
    </div>
  )
}
