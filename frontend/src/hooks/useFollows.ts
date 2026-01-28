import { useState, useCallback } from 'react'
import type { Follow, FollowCounts, FollowStatus } from '../types'

const API_BASE = import.meta.env.VITE_BFF_URL || 'http://localhost:8080'

export function useFollows(userId: string) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followerCount: 0, followingCount: 0 })
  const [followers, setFollowers] = useState<Follow[]>([])
  const [following, setFollowing] = useState<Follow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchFollowStatus = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/follow-status`, {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch follow status')
      }
      const data: FollowStatus = await response.json()
      setIsFollowing(data.isFollowing)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }, [userId])

  const fetchFollowCounts = useCallback(async () => {
    if (!userId) return

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/follow-counts`)
      if (!response.ok) {
        throw new Error('Failed to fetch follow counts')
      }
      const data: FollowCounts = await response.json()
      setFollowCounts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    }
  }, [userId])

  const fetchFollowers = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/followers`)
      if (!response.ok) {
        throw new Error('Failed to fetch followers')
      }
      const data: Follow[] = await response.json()
      setFollowers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const fetchFollowing = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/following`)
      if (!response.ok) {
        throw new Error('Failed to fetch following')
      }
      const data: Follow[] = await response.json()
      setFollowing(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const follow = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to follow user')
      }

      setIsFollowing(true)
      setFollowCounts(prev => ({
        ...prev,
        followerCount: prev.followerCount + 1,
      }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const unfollow = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/follow`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to unfollow user')
      }

      setIsFollowing(false)
      setFollowCounts(prev => ({
        ...prev,
        followerCount: Math.max(0, prev.followerCount - 1),
      }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  return {
    isFollowing,
    followCounts,
    followers,
    following,
    isLoading,
    error,
    follow,
    unfollow,
    fetchFollowStatus,
    fetchFollowCounts,
    fetchFollowers,
    fetchFollowing,
  }
}
