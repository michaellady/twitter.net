import request from 'supertest';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/services/coreServiceClient';

describe('Tweet Routes - Integration Tests', () => {
  const coreServiceUrl = process.env.CORE_SERVICE_URL || 'http://localhost:5000';
  let coreServiceClient: CoreServiceClient;

  beforeAll(() => {
    coreServiceClient = new CoreServiceClient(coreServiceUrl);
  });

  describe('POST /api/tweets end-to-end', () => {
    it('should create a tweet through Core service', async () => {
      const app = createApp(coreServiceClient);

      const response = await request(app)
        .post('/api/tweets')
        .send({ content: 'Integration test tweet' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', 'Integration test tweet');
      expect(response.body).toHaveProperty('createdAt');
    });
  });

  describe('GET /api/feed end-to-end', () => {
    it('should retrieve tweets from Core service', async () => {
      const app = createApp(coreServiceClient);

      // First create a tweet to ensure feed is not empty
      await request(app)
        .post('/api/tweets')
        .send({ content: 'Tweet for feed test' });

      const response = await request(app)
        .get('/api/feed')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('createdAt');
    });
  });
});
