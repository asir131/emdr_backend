import { Response, NextFunction } from 'express';
import { subscriptionService } from './subscription.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const subscriptionController = {
  /**
   * Get all active pricing plans (Public)
   */
  getPlans: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await subscriptionService.getPlans();
      respond(res, data);
    } catch (e) { next(e); }
  },

  /**
   * Get user's current subscription
   */
  getMySubscription: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await subscriptionService.getMySubscription(req.user!.userId);
      respond(res, data);
    } catch (e) { next(e); }
  },

  /**
   * Standard Subscription (Standard/Premium)
   */
  subscribe: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await subscriptionService.subscribe(req.user!.userId, req.body.planId);
      respond(res, data, 201);
    } catch (e) { next(e); }
  },

  /**
   * Apply for Community Access (Free)
   */
  apply: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await subscriptionService.applyForAccess(req.user!.userId, req.body.planId);
      respond(res, data, 201);
    } catch (e) { next(e); }
  },

  // ── ADMIN CONTROLLERS ────────────────────────────────────

  adminGetPlans: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await subscriptionService.adminGetPlans());
    } catch (e) { next(e); }
  },

  adminCreatePlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await subscriptionService.adminCreatePlan(req.body), 201);
    } catch (e) { next(e); }
  },

  adminUpdatePlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await subscriptionService.adminUpdatePlan(req.params.id, req.body));
    } catch (e) { next(e); }
  },

  adminDeletePlan: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await subscriptionService.adminDeletePlan(req.params.id);
      respond(res, { message: 'Plan deleted successfully' });
    } catch (e) { next(e); }
  },

  adminGetRequests: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await subscriptionService.adminGetRequests());
    } catch (e) { next(e); }
  },

  adminReviewRequest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, comment } = req.body;
      respond(res, await subscriptionService.adminReviewRequest(req.params.id, status, comment));
    } catch (e) { next(e); }
  },
};
