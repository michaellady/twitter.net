import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/clients/CoreServiceClient';

// Mock the CoreServiceClient
jest.mock('../../src/clients/CoreServiceClient');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function createTestToken(userId: string = 'user-123', username: string = 'testuser') {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '15m' });
}

describe('POST /api/tweets', () => {
  let app: Application;
  let mockPostTweet: jest.Mock;
  let authToken: string;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPostTweet = jest.fn();
    (CoreServiceClient as jest.Mock).mockImplementation(() => ({
      postTweet: mockPostTweet,
      getTweets: jest.fn(),
      register: jest.fn(),
      login: jest.fn(),
      getUser: jest.fn(),
    }));

    app = createApp({ coreServiceUrl: 'http://mock-core:3001' });
    authToken = createTestToken();
  });

  it('should call Core service with content and userId', async () => {
    const mockTweet = {
      id: '123',
      content: 'Hello world',
      createdAt: '2026-01-26T00:00:00Z',
    };
    mockPostTweet.mockResolvedValue(mockTweet);

    await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello world' })
      .expect(201);

    expect(mockPostTweet).toHaveBeenCalledWith('Hello world', 'user-123');
  });

  it('should return created tweet', async () => {
    const mockTweet = {
      id: '123',
      content: 'Hello world',
      createdAt: '2026-01-26T00:00:00Z',
    };
    mockPostTweet.mockResolvedValue(mockTweet);

    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello world' })
      .expect(201);

    expect(response.body).toEqual(mockTweet);
  });

  it('should handle Core service errors', async () => {
    mockPostTweet.mockRejectedValue(new Error('Core service error: Network error'));

    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello world' })
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when content is missing', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(400);

    expect(response.body.message).toBe('Content is required');
  });

  it('should return 400 when content is empty', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.message).toBe('Content cannot be empty');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .send({ content: 'Hello world' })
      .expect(401);

    expect(response.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .set('Authorization', 'Bearer invalid-token')
      .send({ content: 'Hello world' })
      .expect(401);

    expect(response.body.message).toBe('Invalid token');
  });
});
