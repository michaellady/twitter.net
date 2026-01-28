import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { optionalAuthMiddleware } from '../middleware/auth';

export function createFeedRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // GET /api/feed - Get all tweets
  router.get('/', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.userId;
      const tweets = await coreClient.getTweets(currentUserId);
      res.json(tweets);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
