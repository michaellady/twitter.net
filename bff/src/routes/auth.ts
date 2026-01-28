import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CoreServiceClient } from '../clients/CoreServiceClient';
import { AppError } from '../middleware/errorHandler';
import { RegisterRequest, LoginRequest, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

export function createAuthRoutes(coreClient: CoreServiceClient): Router {
  const router = Router();

  // POST /api/auth/register - Register a new user
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, displayName } = req.body as RegisterRequest;

      if (!username || typeof username !== 'string') {
        throw new AppError('Username is required', 400);
      }

      if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400);
      }

      const user = await coreClient.register(username, password, displayName);

      // Generate JWT token
      const payload: JwtPayload = {
        userId: user.userId,
        username: user.username,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

      // Set httpOnly cookies
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Username is already taken') {
          return next(new AppError('Username is already taken', 409));
        }
        if (error.message.includes('Invalid')) {
          return next(new AppError(error.message, 400));
        }
      }
      next(error);
    }
  });

  // POST /api/auth/login - Login
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as LoginRequest;

      if (!username || typeof username !== 'string') {
        throw new AppError('Username is required', 400);
      }

      if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400);
      }

      const user = await coreClient.login(username, password);

      // Generate JWT token
      const payload: JwtPayload = {
        userId: user.userId,
        username: user.username,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

      // Set httpOnly cookies
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid username or password') {
          return next(new AppError('Invalid username or password', 401));
        }
      }
      next(error);
    }
  });

  // POST /api/auth/logout - Logout
  router.post('/logout', (_req: Request, res: Response) => {
    // Clear auth cookies
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');

    res.json({ success: true });
  });

  // POST /api/auth/refresh - Refresh token
  router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        throw new AppError('Refresh token not found', 401);
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;

      // Generate new tokens
      const payload: JwtPayload = {
        userId: decoded.userId,
        username: decoded.username,
      };

      const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const newRefreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });

      // Set new cookies
      res.cookie('auth_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ token: newToken });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Invalid refresh token', 401));
      }
      next(error);
    }
  });

  // GET /api/auth/me - Get current user
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new AppError('Not authenticated', 401);
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await coreClient.getUser(decoded.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        userId: user.userId,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Invalid token', 401));
      }
      next(error);
    }
  });

  return router;
}

export { JWT_SECRET };
