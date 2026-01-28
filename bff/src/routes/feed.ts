import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { optionalAuthMiddleware } from '../middleware/auth';

export function createFeedRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // GET /api/feed - Get all tweets with user info
  router.get('/', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.userId;
      const tweets = await coreClient.getTweets(currentUserId);

      // Get unique user IDs and fetch user info
      const userIds = [...new Set(tweets.map(t => t.userId))];
      const userMap = new Map<string, { username: string; displayName: string }>();

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await coreClient.getUser(userId);
            if (user) {
              userMap.set(userId, { username: user.username, displayName: user.displayName });
            }
          } catch {
            // User not found, skip
          }
        })
      );

      // Enrich tweets with user info
      const enrichedTweets = tweets.map(tweet => ({
        ...tweet,
        username: userMap.get(tweet.userId)?.username,
        displayName: userMap.get(tweet.userId)?.displayName,
      }));

      res.json(enrichedTweets);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
