import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/clients/CoreServiceClient';

// Mock the CoreServiceClient
jest.mock('../../src/clients/CoreServiceClient');

describe('POST /api/tweets', () => {
  let app: Application;
  let mockPostTweet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPostTweet = jest.fn();
    (CoreServiceClient as jest.Mock).mockImplementation(() => ({
      postTweet: mockPostTweet,
      getTweets: jest.fn(),
    }));

    app = createApp({ coreServiceUrl: 'http://mock-core:3001' });
  });

  it('should call Core service with content', async () => {
    const mockTweet = {
      id: '123',
      content: 'Hello world',
      createdAt: '2026-01-26T00:00:00Z',
    };
    mockPostTweet.mockResolvedValue(mockTweet);

    await request(app)
      .post('/api/tweets')
      .send({ content: 'Hello world' })
      .expect(201);

    expect(mockPostTweet).toHaveBeenCalledWith('Hello world');
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
      .send({ content: 'Hello world' })
      .expect(201);

    expect(response.body).toEqual(mockTweet);
  });

  it('should handle Core service errors', async () => {
    mockPostTweet.mockRejectedValue(new Error('Core service error: Network error'));

    const response = await request(app)
      .post('/api/tweets')
      .send({ content: 'Hello world' })
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when content is missing', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .send({})
      .expect(400);

    expect(response.body.message).toBe('Content is required');
  });

  it('should return 400 when content is empty', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.message).toBe('Content cannot be empty');
  });
});
