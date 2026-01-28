import { useEffect } from 'react'
import { useFollows } from '../hooks/useFollows'

interface FollowButtonProps {
  userId: string
  className?: string
}

export function FollowButton({ userId, className = '' }: FollowButtonProps) {
  const { isFollowing, isLoading, follow, unfollow, fetchFollowStatus } = useFollows(userId)

  useEffect(() => {
    fetchFollowStatus()
  }, [fetchFollowStatus])

  const handleClick = async () => {
    try {
      if (isFollowing) {
        await unfollow()
      } else {
        await follow()
      }
    } catch {
      // Error is already set in the hook
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      data-testid="follow-button"
      className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
        isFollowing
          ? 'bg-transparent border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
          : 'bg-black text-white hover:bg-gray-800'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <span data-testid="follow-loading">...</span>
      ) : isFollowing ? (
        <span data-testid="follow-status-following">Following</span>
      ) : (
        <span data-testid="follow-status-not-following">Follow</span>
      )}
    </button>
  )
}
