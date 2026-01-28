import { Router, Request, Response, NextFunction } from 'express';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { CreateTweetRequest } from '../types';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function createTweetRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/tweets - Create a new tweet (requires auth)
  router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, imageBase64, imageMimeType } = req.body as CreateTweetRequest;

      if (!content || typeof content !== 'string') {
        throw new AppError('Content is required', 400);
      }

      if (content.trim().length === 0) {
        throw new AppError('Content cannot be empty', 400);
      }

      // Validate image if provided
      if (imageBase64 || imageMimeType) {
        if (!imageBase64 || !imageMimeType) {
          throw new AppError('Both imageBase64 and imageMimeType are required when uploading an image', 400);
        }

        if (!ALLOWED_MIME_TYPES.includes(imageMimeType.toLowerCase())) {
          throw new AppError('Invalid image type. Allowed types: jpg, png, gif, webp', 400);
        }

        // Check approximate base64 size (base64 is ~33% larger than binary)
        const estimatedSize = (imageBase64.length * 3) / 4;
        if (estimatedSize > MAX_IMAGE_SIZE) {
          throw new AppError('Image size exceeds maximum allowed (5MB)', 400);
        }
      }

      // Use authenticated user's ID
      const userId = req.user!.userId;
      const tweet = await coreClient.postTweet(content, userId, imageBase64, imageMimeType);
      res.status(201).json(tweet);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
