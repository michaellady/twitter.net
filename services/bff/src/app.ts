import express, { Application } from 'express';
import { ICoreServiceClient } from './services/coreServiceClient';

export function createApp(coreServiceClient: ICoreServiceClient): Application {
  const app = express();
  app.use(express.json());

  // Routes will be implemented in GREEN phase
  // For now, the app exists but routes are not connected

  return app;
}
