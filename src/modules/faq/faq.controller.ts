import { Request, Response, NextFunction } from 'express';
import { faqService } from './faq.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const faqController = {

  // PUBLIC
  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.getAll());
    } catch (e) { next(e); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.getById(req.params.id));
    } catch (e) { next(e); }
  },

  // ADMIN
  getAllAdmin: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.getAllAdmin());
    } catch (e) { next(e); }
  },

  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.create(req.body, req.user!.userId), 201);
    } catch (e) { next(e); }
  },

  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.update(req.params.id, req.body, req.user!.userId));
    } catch (e) { next(e); }
  },

  reorder: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.reorder(req.body.items, req.user!.userId));
    } catch (e) { next(e); }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      respond(res, await faqService.delete(req.params.id));
    } catch (e) { next(e); }
  },
};
