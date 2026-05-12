import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserSubscription, SubscriptionStatus } from '../modules/subscriptions/subscription.model';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware: requireSubscription
 *
 * Access rules:
 * - Admin              → always allowed
 * - Active + not expired → allowed
 * - Active but expired  → auto-mark as EXPIRED, block with renewal message
 * - Pending             → blocked with "awaiting approval" message
 * - No subscription     → blocked with "apply for a plan" message
 */
export const requireSubscription = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Admin always has access
    if (req.user?.role === 'admin') return next();

    const userId = req.user?.userId;
    if (!userId) return next(ApiError.unauthorized('Authentication required'));

    // Check active subscription
    const activeSub = await UserSubscription.findOne({
      userId,
      status: SubscriptionStatus.ACTIVE,
    }).populate('planId').lean();

    if (activeSub) {
      // Check if subscription has expired
      if (activeSub.endDate && new Date() > new Date(activeSub.endDate)) {
        // Auto-mark as expired in DB
        await UserSubscription.findByIdAndUpdate(activeSub._id, {
          status: SubscriptionStatus.EXPIRED,
        });

        return next(
          new ApiError(
            403,
            'SUBSCRIPTION_EXPIRED',
            'Your free plan has expired. Please re-apply or upgrade to continue.'
          )
        );
      }

      // Valid active subscription
      (req as any).subscription = activeSub;
      return next();
    }

    // Check pending subscription (applied, awaiting admin approval)
    const pendingSub = await UserSubscription.findOne({
      userId,
      status: SubscriptionStatus.PENDING,
    }).lean();

    if (pendingSub) {
      return next(
        new ApiError(
          403,
          'SUBSCRIPTION_PENDING',
          'Your application is under review. You will receive access once an admin approves your request.'
        )
      );
    }

    // No subscription at all
    return next(
      new ApiError(
        403,
        'NO_SUBSCRIPTION',
        'You need an active subscription to access this feature. Please apply for a plan.'
      )
    );
  } catch (error) {
    next(error);
  }
};
