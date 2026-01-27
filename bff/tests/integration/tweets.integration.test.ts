import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';

/**
 * Integration tests for tweet routes.
 * These tests require a running Core service.
 * Set CORE_SERVICE_URL environment variable to point to the Core service.
 *
 * Run with: CORE_SERVICE_URL=http://localhost:3001 npm run test:integration
 */

const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3001';

describe('Integration: POST /api/tweets', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp({ coreServiceUrl: CORE_SERVICE_URL });
  });

  // Skip if Core service is not available
  const itIfCore = process.env.SKIP_INTEGRATION ? it.skip : it;

  itIfCore('should create a tweet end-to-end', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .send({ content: 'Integration test tweet' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('content', 'Integration test tweet');
    expect(response.body).toHaveProperty('createdAt');
  });

  itIfCore('should return proper JSON response', async () => {
    const response = await request(app)
      .post('/api/tweets')
      .send({ content: 'Another test tweet' });

    expect(response.headers['content-type']).toMatch(/json/);
  });
});

describe('Integration: GET /api/feed', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp({ coreServiceUrl: CORE_SERVICE_URL });
  });

  const itIfCore = process.env.SKIP_INTEGRATION ? it.skip : it;

  itIfCore('should get tweets end-to-end', async () => {
    const response = await request(app)
      .get('/api/feed')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  itIfCore('should return proper JSON response', async () => {
    const response = await request(app)
      .get('/api/feed');

    expect(response.headers['content-type']).toMatch(/json/);
  });
});
