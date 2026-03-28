import { Request, Response, NextFunction } from 'express';
import { aboutService } from './about.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const aboutController = {

  get: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await aboutService.get());
    } catch (e) { next(e); }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await aboutService.create(req.body.aboutUs, req.user!.userId), 201);
    } catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await aboutService.update(req.body.aboutUs, req.user!.userId));
    } catch (e) { next(e); }
  },
};
