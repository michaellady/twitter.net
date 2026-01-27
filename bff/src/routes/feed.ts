import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';

export function createFeedRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // GET /api/feed - Get all tweets
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tweets = await coreClient.getTweets();
      res.json(tweets);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
