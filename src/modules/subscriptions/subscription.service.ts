import {
  SubscriptionPlan,
  UserSubscription,
  SubscriptionRequest,
  SubscriptionStatus,
} from './subscription.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

export const subscriptionService = {
  /**
   * Get all active subscription plans
   */
  async getPlans() {
    return SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }).lean();
  },

  /**
   * Get user's current subscription
   */
  async getMySubscription(userId: string) {
    return UserSubscription.findOne({ userId, status: SubscriptionStatus.ACTIVE })
      .populate('planId')
      .lean();
  },

  /**
   * Subscribe to a plan (Standard/Premium)
   * Note: In a real app, this would involve a payment gateway.
   */
  async subscribe(userId: string, planId: string) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw ApiError.notFound('Subscription plan not found or inactive');
    }

    if (plan.isCommunityAccess) {
      throw ApiError.validationError('Use the Apply for Access endpoint for this plan');
    }

    // Standard logic: Deactivate old and create new
    await UserSubscription.updateMany(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELED }
    );

    const subscription = await UserSubscription.create({
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
    });

    logger.info('User subscribed to plan', { userId, planId, subscriptionId: subscription._id });
    return subscription;
  },

  /**
   * Apply for Community Access (Free)
   * Creates a SubscriptionRequest (for admin review) AND
   * a UserSubscription with status=pending (blocks access until approved)
   */
  async applyForAccess(userId: string, planId: string) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isCommunityAccess) {
      throw ApiError.validationError('Invalid plan for Community Access application');
    }

    // Check if there's already a pending request
    const existing = await SubscriptionRequest.findOne({ userId, planId, status: 'pending' });
    if (existing) {
      throw ApiError.validationError('You already have a pending application for this plan');
    }

    // Check if already active on this plan
    const alreadyActive = await UserSubscription.findOne({ userId, planId, status: SubscriptionStatus.ACTIVE });
    if (alreadyActive) {
      throw ApiError.validationError('You already have an active subscription to this plan');
    }

    // Create the review request
    const request = await SubscriptionRequest.create({
      userId,
      planId,
      status: 'pending',
    });

    // Create a PENDING subscription — blocks feature access until admin approves
    await UserSubscription.findOneAndUpdate(
      { userId, planId },
      {
        userId,
        planId,
        status: SubscriptionStatus.PENDING,
        startDate: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info('Community Access request submitted — subscription pending approval', { userId, planId, requestId: request._id });
    return {
      requestId: request._id,
      status: 'pending',
      message: 'Your application has been submitted. Access will be granted once an admin approves your request.',
    };
  },

  // ── ADMIN METHODS ────────────────────────────────────────

  async adminGetPlans() {
    return SubscriptionPlan.find().sort({ price: 1 }).lean();
  },

  async adminCreatePlan(data: any) {
    const plan = await SubscriptionPlan.create(data);
    logger.info('New subscription plan created by admin', { planId: plan._id });
    return plan;
  },

  async adminUpdatePlan(id: string, data: any) {
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  },

  async adminDeletePlan(id: string) {
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) throw ApiError.notFound('Plan not found');
    logger.info('Subscription plan deleted by admin', { planId: id });
    return plan;
  },

  async adminGetRequests() {
    return SubscriptionRequest.find()
      .populate('userId', 'firstName lastName email')
      .populate('planId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  },

  async adminReviewRequest(requestId: string, status: 'approved' | 'rejected', comment?: string) {
    const request = await SubscriptionRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Request not found');
    if (request.status !== 'pending') throw ApiError.validationError('Request already processed');

    request.status = status;
    request.adminComment = comment;
    await request.save();

    if (status === 'approved') {
      // Cancel any other active subscriptions
      await UserSubscription.updateMany(
        { userId: request.userId, status: SubscriptionStatus.ACTIVE },
        { status: SubscriptionStatus.CANCELED }
      );

      // 1 month expiry from approval date
      const startDate = new Date();
      const endDate   = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Activate the pending subscription for this plan
      const updated = await UserSubscription.findOneAndUpdate(
        { userId: request.userId, planId: request.planId },
        {
          status:    SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          autoRenew: false,
        },
        { new: true }
      );

      // If no pending subscription exists (edge case), create one
      if (!updated) {
        await UserSubscription.create({
          userId:    request.userId,
          planId:    request.planId,
          status:    SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          autoRenew: false,
        });
      }

      logger.info('Community Access approved — 1 month subscription activated', {
        userId: request.userId,
        startDate,
        endDate,
      });
    } else {
      // Rejected — remove the pending subscription so user can re-apply later
      await UserSubscription.findOneAndDelete({
        userId: request.userId,
        planId: request.planId,
        status: SubscriptionStatus.PENDING,
      });

      logger.info('Community Access rejected — pending subscription removed', { userId: request.userId });
    }

    return {
      requestId: request._id,
      status: request.status,
      adminComment: request.adminComment,
      message: status === 'approved'
        ? 'Application approved. User now has full access.'
        : 'Application rejected. User has been notified.',
    };
  },
};
