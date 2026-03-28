import { Request, Response, NextFunction } from 'express';
import { privacyService } from './privacy.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const privacyController = {

  // PUBLIC
  getActive: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.getActive());
    } catch (e) { next(e); }
  },

  // ADMIN
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.getAll());
    } catch (e) { next(e); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.getById(req.params.id));
    } catch (e) { next(e); }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.create(req.body, req.user!.userId), 201);
    } catch (e) { next(e); }
  },

  replace: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.replace(req.params.id, req.body, req.user!.userId));
    } catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.update(req.params.id, req.body, req.user!.userId));
    } catch (e) { next(e); }
  },

  setActive: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.setActive(req.params.id, req.user!.userId));
    } catch (e) { next(e); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await privacyService.delete(req.params.id));
    } catch (e) { next(e); }
  },
};
