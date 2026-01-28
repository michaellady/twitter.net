import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export function createFollowRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/users/:userId/follow - Follow a user
  router.post('/:userId/follow', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const followerId = req.user!.userId;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const follow = await coreClient.followUser(followerId, userId);

      res.status(201).json(follow);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('cannot follow themselves')) {
          return next(new AppError('You cannot follow yourself', 400));
        }
        if (error.message.includes('does not exist')) {
          return next(new AppError('User not found', 404));
        }
        if (error.message.includes('Already following')) {
          return next(new AppError('Already following this user', 409));
        }
      }
      next(error);
    }
  });

  // DELETE /api/users/:userId/follow - Unfollow a user
  router.delete('/:userId/follow', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const followerId = req.user!.userId;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      await coreClient.unfollowUser(followerId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // GET /api/users/:userId/followers - Get followers
  router.get('/:userId/followers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const followers = await coreClient.getFollowers(userId);

      res.json(followers);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/users/:userId/following - Get users being followed
  router.get('/:userId/following', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const following = await coreClient.getFollowing(userId);

      res.json(following);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/users/:userId/follow-status - Check if current user follows this user
  router.get('/:userId/follow-status', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const followerId = req.user?.userId;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      // If not authenticated, return not following
      if (!followerId) {
        return res.json({ isFollowing: false });
      }

      const status = await coreClient.getFollowStatus(userId, followerId);

      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/users/:userId/follow-counts - Get follower and following counts
  router.get('/:userId/follow-counts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError('User ID is required', 400);
      }

      const counts = await coreClient.getFollowCounts(userId);

      res.json(counts);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
