import { Response, NextFunction } from 'express';
import { weeklyReviewService } from './weeklyReview.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const weeklyReviewController = {

  // ========== NEW: Auto-detect active plan (no planId needed) ==========
  
  getCurrentForUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.getCurrentReviewForUser(req.user!.userId));
    } catch (e) { next(e); }
  },

  saveForUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.saveReviewForUser(req.user!.userId, req.body), 201);
    } catch (e) { next(e); }
  },

  updateStepForUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.updateStepReviewForUser(req.user!.userId, req.body));
    } catch (e) { next(e); }
  },

  // ========== Original: With planId ==========

  getCurrent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.getCurrentReview(req.params.id, req.user!.userId));
    } catch (e) { next(e); }
  },

  save: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.saveReview(req.params.id, req.user!.userId, req.body), 201);
    } catch (e) { next(e); }
  },

  updateStep: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.updateStepReview(req.params.id, req.user!.userId, req.body));
    } catch (e) { next(e); }
  },

  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await weeklyReviewService.getReviewHistory(req.params.id, req.user!.userId));
    } catch (e) { next(e); }
  },
};
