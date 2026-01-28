import { useState, useEffect, useCallback } from 'react'
import type { Tweet } from '../types'

const API_BASE = import.meta.env.VITE_BFF_URL || 'http://localhost:8080'

export function useTweets() {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTweets = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/feed`)
      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }
      const data = await response.json()
      setTweets(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  const postTweet = useCallback(async (content: string) => {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error('Failed to post tweet')
    }

    // Refetch tweets after posting
    await fetchTweets()
  }, [fetchTweets])

  return {
    tweets,
    isLoading,
    error,
    postTweet,
    refetch: fetchTweets,
  }
}
