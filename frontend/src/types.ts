export interface Tweet {
  id: string
  content: string
  userId: string
  username?: string
  displayName?: string
  createdAt: string
  imageUrl?: string
  likeCount: number
  isLikedByCurrentUser: boolean
}

export interface LikeResponse {
  liked: boolean
  likeCount: number
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
