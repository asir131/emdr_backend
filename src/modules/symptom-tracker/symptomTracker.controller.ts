import { Request, Response, NextFunction } from 'express';
import { symptomTrackerService as svc } from './symptomTracker.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const symptomTrackerController = {

  listConfigs: async (_req: Request, res: Response, next: NextFunction) => {
    try { respond(res, await svc.listConfigs()); }
    catch (e) { next(e); }
  },

  getConfigByType: async (req: Request, res: Response, next: NextFunction) => {
    try { respond(res, await svc.getConfigByType(req.params.type)); }
    catch (e) { next(e); }
  },

  listConfigsAdmin: async (_req: Request, res: Response, next: NextFunction) => {
    try { respond(res, await svc.listConfigsAdmin()); }
    catch (e) { next(e); }
  },

  createConfig: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { respond(res, await svc.createConfig(req.body, req.user!.userId), 201); }
    catch (e) { next(e); }
  },

  updateConfig: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { respond(res, await svc.updateConfig(req.params.type, req.body, req.user!.userId)); }
    catch (e) { next(e); }
  },

  deleteConfig: async (req: Request, res: Response, next: NextFunction) => {
    try { respond(res, await svc.deleteConfig(req.params.type)); }
    catch (e) { next(e); }
  },

  submit: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackerType, answers, stemValue } = req.body;
      respond(res, await svc.submitTracker(req.user!.userId, trackerType, answers, stemValue), 201);
    } catch (e) { next(e); }
  },

  getHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackerType, page, limit } = req.query as Record<string, string>;
      respond(res, await svc.getHistory(
        req.user!.userId,
        trackerType,
        page  ? parseInt(page)  : 1,
        limit ? parseInt(limit) : 20
      ));
    } catch (e) { next(e); }
  },

  getSubmissionById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { respond(res, await svc.getSubmissionById(req.params.id, req.user!.userId)); }
    catch (e) { next(e); }
  },

  getTrend: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackerType, limit } = req.query as Record<string, string>;
      if (!trackerType) {
        res.status(400).json({ success: false, error: { message: 'trackerType query param is required' } });
        return;
      }
      respond(res, await svc.getTrend(req.user!.userId, trackerType, limit ? parseInt(limit) : 10));
    } catch (e) { next(e); }
  },

  getLatest: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackerType } = req.query as Record<string, string>;
      respond(res, await svc.getLatest(req.user!.userId, trackerType));
    } catch (e) { next(e); }
  },

  adminListSubmissions: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { trackerType, userId, page, limit } = req.query as Record<string, string>;
      respond(res, await svc.adminListSubmissions({
        trackerType,
        userId,
        page : page  ? parseInt(page,  10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }));
    } catch (e) { next(e); }
  },

  adminStats: async (_req: Request, res: Response, next: NextFunction) => {
    try { respond(res, await svc.adminStats()); }
    catch (e) { next(e); }
  },
};
