export interface Tweet {
  tweetId: string;
  userId: string;
  username?: string;
  displayName?: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
}

export interface CreateTweetRequest {
  content: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface User {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface FollowCounts {
  followerCount: number;
  followingCount: number;
}

export interface FollowStatus {
  isFollowing: boolean;
}

export interface TimelineResponse {
  tweets: Tweet[];
  nextCursor: string | null;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}
