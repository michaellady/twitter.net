import axios, { AxiosInstance, AxiosError } from 'axios';
import { Tweet, User } from '../types';

interface CoreUserResponse {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
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

  async postTweet(content: string, userId: string = 'user-1'): Promise<Tweet> {
    try {
      const response = await this.client.post<Tweet>('/api/tweets', { content, userId });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Core service error: ${error.message}`);
      }
      throw error;
    }
  }

  async getTweets(): Promise<Tweet[]> {
    try {
      const response = await this.client.get<Tweet[]>('/api/tweets');
      return response.data;
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
}
