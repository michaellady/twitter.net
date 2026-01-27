import request from 'supertest';
import { createApp } from '../../src/app';
import { ICoreServiceClient, Tweet, CreateTweetRequest } from '../../src/services/coreServiceClient';

describe('Tweet Routes - Unit Tests', () => {
  let mockCoreServiceClient: jest.Mocked<ICoreServiceClient>;

  beforeEach(() => {
    mockCoreServiceClient = {
      createTweet: jest.fn(),
      getFeed: jest.fn(),
    };
  });

  describe('POST /api/tweets', () => {
    it('should call Core service with content', async () => {
      const mockTweet: Tweet = {
        id: '123',
        content: 'Hello, world!',
        createdAt: '2026-01-26T12:00:00Z',
      };
      mockCoreServiceClient.createTweet.mockResolvedValue(mockTweet);

      const app = createApp(mockCoreServiceClient);
      await request(app)
        .post('/api/tweets')
        .send({ content: 'Hello, world!' })
        .expect(201);

      expect(mockCoreServiceClient.createTweet).toHaveBeenCalledWith({
        content: 'Hello, world!',
      });
    });

    it('should return created tweet', async () => {
      const mockTweet: Tweet = {
        id: '123',
        content: 'Hello, world!',
        createdAt: '2026-01-26T12:00:00Z',
      };
      mockCoreServiceClient.createTweet.mockResolvedValue(mockTweet);

      const app = createApp(mockCoreServiceClient);
      const response = await request(app)
        .post('/api/tweets')
        .send({ content: 'Hello, world!' })
        .expect(201);

      expect(response.body).toEqual(mockTweet);
    });

    it('should handle Core service errors', async () => {
      mockCoreServiceClient.createTweet.mockRejectedValue(
        new Error('Core service error: 500')
      );

      const app = createApp(mockCoreServiceClient);
      const response = await request(app)
        .post('/api/tweets')
        .send({ content: 'Hello, world!' })
        .expect(502);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/feed', () => {
    it('should call Core service', async () => {
      const mockTweets: Tweet[] = [
        { id: '1', content: 'First tweet', createdAt: '2026-01-26T12:00:00Z' },
        { id: '2', content: 'Second tweet', createdAt: '2026-01-26T11:00:00Z' },
      ];
      mockCoreServiceClient.getFeed.mockResolvedValue(mockTweets);

      const app = createApp(mockCoreServiceClient);
      await request(app)
        .get('/api/feed')
        .expect(200);

      expect(mockCoreServiceClient.getFeed).toHaveBeenCalled();
    });

    it('should return tweets array', async () => {
      const mockTweets: Tweet[] = [
        { id: '1', content: 'First tweet', createdAt: '2026-01-26T12:00:00Z' },
        { id: '2', content: 'Second tweet', createdAt: '2026-01-26T11:00:00Z' },
      ];
      mockCoreServiceClient.getFeed.mockResolvedValue(mockTweets);

      const app = createApp(mockCoreServiceClient);
      const response = await request(app)
        .get('/api/feed')
        .expect(200);

      expect(response.body).toEqual(mockTweets);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle empty response', async () => {
      mockCoreServiceClient.getFeed.mockResolvedValue([]);

      const app = createApp(mockCoreServiceClient);
      const response = await request(app)
        .get('/api/feed')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
