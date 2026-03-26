import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../modules/auth/auth.model';
import { redis, CACHE_TTL } from '../config/redis';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    isVerified: boolean;
  };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const { userId } = decoded;

    // Check Redis cache first — avoids DB hit on every request
    const cacheKey = `auth:check:${userId}`;
    let isActive: boolean | null = null;

    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        isActive = cached === '1';
      }
    } catch {
      logger.warn('Redis auth check failed, falling back to DB', { userId });
    }

    if (isActive === null) {
      // Cache miss — query DB
      const user = await User.findOne({ _id: userId, isDeleted: false }).select('_id').lean();
      isActive = !!user;

      try {
        // Cache result: '1' = active, '0' = deleted
        await redis.setex(cacheKey, CACHE_TTL.AUTH_CHECK, isActive ? '1' : '0');
      } catch {
        // Non-fatal
      }
    }

    if (!isActive) {
      throw ApiError.unauthorized('Account no longer exists');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
};
