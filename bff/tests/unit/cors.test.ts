import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { CoreServiceClient } from '../../src/clients/CoreServiceClient';

// Mock the CoreServiceClient
jest.mock('../../src/clients/CoreServiceClient');

describe('CORS configuration', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();

    (CoreServiceClient as jest.Mock).mockImplementation(() => ({
      postTweet: jest.fn().mockResolvedValue({ id: '1', content: 'test', createdAt: '2026-01-26T00:00:00Z' }),
      getTweets: jest.fn().mockResolvedValue([]),
    }));

    app = createApp({
      coreServiceUrl: 'http://mock-core:3001',
      frontendOrigin: 'http://localhost:3000',
    });
  });

  it('should include CORS headers in response', async () => {
    const response = await request(app)
      .get('/api/feed')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should handle preflight requests', async () => {
    const response = await request(app)
      .options('/api/tweets')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-methods']).toBeDefined();
  });
});
