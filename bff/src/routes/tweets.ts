import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { CreateTweetRequest } from '../types';

export function createTweetRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/tweets - Create a new tweet
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body as CreateTweetRequest;

      if (!content || typeof content !== 'string') {
        throw new AppError('Content is required', 400);
      }

      if (content.trim().length === 0) {
        throw new AppError('Content cannot be empty', 400);
      }

      const tweet = await coreClient.postTweet(content);
      res.status(201).json(tweet);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
