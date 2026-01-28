import axios, { AxiosInstance, AxiosError } from 'axios';
import { Tweet, User, Follow, FollowCounts, FollowStatus, LikeResponse } from '../types';

interface CoreUserResponse {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
}

interface CoreTweetResponse {
  tweetId: string;
  userId: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
}

interface CoreLikeResponse {
  liked: boolean;
  likeCount: number;
}

interface CoreTimelineResponse {
  tweets: CoreTweetResponse[];
  nextCursor: string | null;
}

interface TimelineResult {
  tweets: Tweet[];
  nextCursor: string | null;
}

export class CoreServiceClient {
  private client: AxiosInstance;

  constructor(coreUrl: string = process.env.CORE_SERVICE_URL || 'http://localhost:3001') {
    this.client = axios.create({
      baseURL: coreUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async postTweet(
    content: string,
    userId: string = 'user-1',
    imageBase64?: string,
    imageMimeType?: string
  ): Promise<Tweet> {
    try {
      const payload: Record<string, string | undefined> = { content, userId };
      if (imageBase64 && imageMimeType) {
        payload.imageBase64 = imageBase64;
        payload.imageMimeType = imageMimeType;
      }
      const response = await this.client.post<CoreTweetResponse>('/api/tweets', payload);
      return {
        tweetId: response.data.tweetId,
        userId: response.data.userId,
        content: response.data.content,
        createdAt: response.data.createdAt,
        imageUrl: response.data.imageUrl,
        likeCount: response.data.likeCount || 0,
        isLikedByCurrentUser: response.data.isLikedByCurrentUser || false,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getTweets(currentUserId?: string): Promise<Tweet[]> {
    try {
      const params = currentUserId ? { currentUserId } : {};
      const response = await this.client.get<CoreTweetResponse[]>('/api/tweets', { params });
      return response.data.map(t => ({
        tweetId: t.tweetId,
        userId: t.userId,
        content: t.content,
        createdAt: t.createdAt,
        imageUrl: t.imageUrl,
        likeCount: t.likeCount || 0,
        isLikedByCurrentUser: t.isLikedByCurrentUser || false,
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async register(username: string, password: string, displayName?: string): Promise<User> {
    try {
      const response = await this.client.post<CoreUserResponse>('/api/auth/register', {
        username,
        password,
        displayName: displayName || username,
      });
      return {
        userId: response.data.userId,
        username: response.data.username,
        displayName: response.data.displayName,
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid request');
        }
        if (error.response?.status === 409) {
          throw new Error('Username is already taken');
        }
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async login(username: string, password: string): Promise<User> {
    try {
      const response = await this.client.post<CoreUserResponse>('/api/auth/login', {
        username,
        password,
      });
      return {
        userId: response.data.userId,
        username: response.data.username,
        displayName: response.data.displayName,
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password');
        }
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await this.client.get<CoreUserResponse>(`/api/auth/user/${userId}`);
      return {
        userId: response.data.userId,
        username: response.data.username,
        displayName: response.data.displayName,
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return null;
        }
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    try {
      const response = await this.client.post<Follow>(`/api/users/${followingId}/follow`, {
        followerId,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid request');
        }
        if (error.response?.status === 409) {
          throw new Error(error.response.data?.error || 'Already following this user');
        }
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      await this.client.delete(`/api/users/${followingId}/follow`, {
        data: { followerId },
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.error || 'Invalid request');
        }
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    try {
      const response = await this.client.get<Follow[]>(`/api/users/${userId}/followers`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    try {
      const response = await this.client.get<Follow[]>(`/api/users/${userId}/following`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getFollowStatus(userId: string, followerId: string): Promise<FollowStatus> {
    try {
      const response = await this.client.get<FollowStatus>(
        `/api/users/${userId}/follow-status?followerId=${followerId}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getFollowCounts(userId: string): Promise<FollowCounts> {
    try {
      const response = await this.client.get<FollowCounts>(`/api/users/${userId}/follow-counts`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async likeTweet(tweetId: string, userId: string): Promise<LikeResponse> {
    try {
      const response = await this.client.post<CoreLikeResponse>(
        `/api/tweets/${tweetId}/like`,
        { userId }
      );
      return {
        liked: response.data.liked,
        likeCount: response.data.likeCount,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async unlikeTweet(tweetId: string, userId: string): Promise<LikeResponse> {
    try {
      const response = await this.client.delete<CoreLikeResponse>(
        `/api/tweets/${tweetId}/like`,
        { data: { userId } }
      );
      return {
        liked: response.data.liked,
        likeCount: response.data.likeCount,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getTimeline(userId: string, cursor?: string, limit: number = 20): Promise<TimelineResult> {
    try {
      const params: Record<string, string | number> = { limit };
      if (cursor) {
        params.cursor = cursor;
      }
      const response = await this.client.get<CoreTimelineResponse>(
        `/Timeline/${userId}`,
        { params }
      );
      return {
        tweets: response.data.tweets.map(t => ({
          tweetId: t.tweetId,
          userId: t.userId,
          content: t.content,
          createdAt: t.createdAt,
          imageUrl: t.imageUrl,
          likeCount: t.likeCount || 0,
          isLikedByCurrentUser: t.isLikedByCurrentUser || false,
        })),
        nextCursor: response.data.nextCursor,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }
}
