import { Response, NextFunction } from 'express';
import { journeyService } from './journey.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const journeyController = {

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await journeyService.create(req.user!.userId, req.body), 201);
    } catch (e) { next(e); }
  },

  list: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await journeyService.list());
    } catch (e) { next(e); }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await journeyService.getById(req.params.id));
    } catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await journeyService.update(req.params.id, req.body));
    } catch (e) { next(e); }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      ok(res, await journeyService.delete(req.params.id));
    } catch (e) { next(e); }
  },
};
