import { Response, NextFunction } from 'express';
import { sessionProgressService } from './sessionProgress.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const sessionProgressController = {
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionProgressService.updateProgress(req.user!.userId, req.body);
      respond(res, result);
    } catch (e) { next(e); }
  },

  get: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionProgressService.getProgress(req.user!.userId, req.params.journeyId);
      respond(res, result);
    } catch (e) { next(e); }
  },

  markRoadmapIntroCompleted: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await sessionProgressService.markRoadmapIntroCompleted(
        req.user!.userId,
        req.params.journeyId
      );
      respond(res, result);
    } catch (e) { next(e); }
  },
};
