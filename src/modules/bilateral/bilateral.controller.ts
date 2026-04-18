import { Response, NextFunction } from 'express';
import { bilateralService, settingsService } from './bilateral.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const bilateralController = {

  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { type, isActive } = req.query as any;
      ok(res, await bilateralService.list(type, isActive));
    } catch (e) { next(e); }
  },

  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await bilateralService.getById(req.params.id)); }
    catch (e) { next(e); }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await bilateralService.create(req.body, req.file), 201); }
    catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await bilateralService.update(req.params.id, req.body, req.file)); }
    catch (e) { next(e); }
  },

  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await bilateralService.delete(req.params.id)); }
    catch (e) { next(e); }
  },
};

export const settingsController = {

  getFullConfig: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await settingsService.getFullConfig(req.user!.userId)); }
    catch (e) { next(e); }
  },

  save: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await settingsService.save(req.user!.userId, req.body)); }
    catch (e) { next(e); }
  },
};
