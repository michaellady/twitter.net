import { useState, useEffect, useCallback } from 'react'
import type { Tweet } from '../types'

const API_BASE = import.meta.env.VITE_BFF_URL || 'http://localhost:8080'

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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

  const postTweet = useCallback(async (content: string, imageFile?: File) => {
    let imageBase64: string | undefined
    let imageMimeType: string | undefined

    if (imageFile) {
      imageMimeType = imageFile.type
      imageBase64 = await fileToBase64(imageFile)
    }

    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, imageBase64, imageMimeType }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to post tweet' }))
      throw new Error(error.message || 'Failed to post tweet')
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
