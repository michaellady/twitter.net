import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { CreateTweetRequest } from '../types';

export function createTweetRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/tweets - Create a new tweet (requires auth)
  router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body as CreateTweetRequest;

      if (!content || typeof content !== 'string') {
        throw new AppError('Content is required', 400);
      }

      if (content.trim().length === 0) {
        throw new AppError('Content cannot be empty', 400);
      }

      // Use authenticated user's ID
      const userId = req.user!.userId;
      const tweet = await coreClient.postTweet(content, userId);
      res.status(201).json(tweet);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
