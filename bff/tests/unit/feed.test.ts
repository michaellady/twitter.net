import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/clients/CoreServiceClient';

// Mock the CoreServiceClient
jest.mock('../../src/clients/CoreServiceClient');

describe('GET /api/feed', () => {
  let app: Application;
  let mockGetTweets: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetTweets = jest.fn();
    (CoreServiceClient as jest.Mock).mockImplementation(() => ({
      postTweet: jest.fn(),
      getTweets: mockGetTweets,
    }));

    app = createApp({ coreServiceUrl: 'http://mock-core:3001' });
  });

  it('should call Core service', async () => {
    mockGetTweets.mockResolvedValue([]);

    await request(app)
      .get('/api/feed')
      .expect(200);

    expect(mockGetTweets).toHaveBeenCalled();
  });

  it('should return tweets array', async () => {
    const mockTweets = [
      { id: '1', content: 'First tweet', createdAt: '2026-01-26T00:00:00Z' },
      { id: '2', content: 'Second tweet', createdAt: '2026-01-26T01:00:00Z' },
    ];
    mockGetTweets.mockResolvedValue(mockTweets);

    const response = await request(app)
      .get('/api/feed')
      .expect(200);

    expect(response.body).toEqual(mockTweets);
  });

  it('should handle empty response', async () => {
    mockGetTweets.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/feed')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should handle Core service errors', async () => {
    mockGetTweets.mockRejectedValue(new Error('Core service error: Network error'));

    const response = await request(app)
      .get('/api/feed')
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });
});
