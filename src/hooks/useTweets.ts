// Stub hook - tests should fail
import { TweetData } from '../components/Tweet'

export interface UseTweetsResult {
  tweets: TweetData[]
  loading: boolean
  postTweet: (content: string) => Promise<void>
}

export function useTweets(): UseTweetsResult {
  // TODO: Implement in GREEN phase
  return {
    tweets: [],
    loading: false,
    postTweet: async () => {},
  }
}
