import express, { Application } from 'express';
import cors from 'cors';
import { CoreServiceClient } from './clients/CoreServiceClient';
import { createTweetRoutes } from './routes/tweets';
import { createFeedRoutes } from './routes/feed';
import { errorHandler } from './middleware/errorHandler';

export interface AppConfig {
  coreServiceUrl?: string;
  frontendOrigin?: string;
}

export function createApp(config: AppConfig = {}): Application {
  const app = express();

  // Create Core service client
  const coreClient = new CoreServiceClient(config.coreServiceUrl);

  // Middleware
  app.use(cors({
    origin: config.frontendOrigin || process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'bff' });
  });

  // Routes
  app.use('/api/tweets', createTweetRoutes(coreClient));
  app.use('/api/feed', createFeedRoutes(coreClient));

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
