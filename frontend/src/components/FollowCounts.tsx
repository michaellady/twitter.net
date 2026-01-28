import { useEffect } from 'react'
import { useFollows } from '../hooks/useFollows'

interface FollowCountsProps {
  userId: string
  className?: string
}

export function FollowCounts({ userId, className = '' }: FollowCountsProps) {
  const { followCounts, fetchFollowCounts } = useFollows(userId)

  useEffect(() => {
    fetchFollowCounts()
  }, [fetchFollowCounts])

  return (
    <div className={`flex gap-4 text-sm ${className}`} data-testid="follow-counts">
      <span data-testid="following-count">
        <span className="font-semibold">{followCounts.followingCount}</span>{' '}
        <span className="text-gray-500">Following</span>
      </span>
      <span data-testid="follower-count">
        <span className="font-semibold">{followCounts.followerCount}</span>{' '}
        <span className="text-gray-500">Followers</span>
      </span>
    </div>
  )
}
