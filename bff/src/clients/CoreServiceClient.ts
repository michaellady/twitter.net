import axios, { AxiosInstance, AxiosError } from 'axios';
import { Tweet } from '../types';

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

  async postTweet(content: string): Promise<Tweet> {
    try {
      const response = await this.client.post<Tweet>('/api/tweets', { content });
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
}
