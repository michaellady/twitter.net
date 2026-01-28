import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

export function createLikeRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/tweets/:tweetId/like - Like a tweet (requires auth)
  router.post('/:tweetId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tweetId } = req.params;

      if (!tweetId) {
        throw new AppError('Tweet ID is required', 400);
      }

      const userId = req.user!.userId;
      const result = await coreClient.likeTweet(tweetId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/tweets/:tweetId/like - Unlike a tweet (requires auth)
  router.delete('/:tweetId/like', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tweetId } = req.params;

      if (!tweetId) {
        throw new AppError('Tweet ID is required', 400);
      }

      const userId = req.user!.userId;
      const result = await coreClient.unlikeTweet(tweetId, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
