export interface Tweet {
  id: string;
  content: string;
  createdAt: string;
}

export interface CreateTweetRequest {
  content: string;
}

export interface ICoreServiceClient {
  createTweet(request: CreateTweetRequest): Promise<Tweet>;
  getFeed(): Promise<Tweet[]>;
}

export class CoreServiceClient implements ICoreServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.CORE_SERVICE_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async createTweet(request: CreateTweetRequest): Promise<Tweet> {
    const response = await fetch(`${this.baseUrl}/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Core service error: ${response.status}`);
    }

    return response.json() as Promise<Tweet>;
  }

  async getFeed(): Promise<Tweet[]> {
    const response = await fetch(`${this.baseUrl}/tweets`);

    if (!response.ok) {
      throw new Error(`Core service error: ${response.status}`);
    }

    return response.json() as Promise<Tweet[]>;
  }
}
