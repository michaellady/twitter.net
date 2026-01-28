export interface Tweet {
  id: string
  content: string
  userId: string
  createdAt: string
  imageUrl?: string
}

export interface User {
  userId: string
  username: string
  displayName: string
  createdAt: string
}

export interface Follow {
  followerId: string
  followingId: string
  createdAt: string
}

export interface FollowCounts {
  followerCount: number
  followingCount: number
}

export interface FollowStatus {
  isFollowing: boolean
}
