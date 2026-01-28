import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { authMiddleware } from '../middleware/auth';

export function createTimelineRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // GET /api/timeline - Get authenticated user's personalized timeline
  router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      const timeline = await coreClient.getTimeline(userId, cursor, limit);
      res.json(timeline);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
