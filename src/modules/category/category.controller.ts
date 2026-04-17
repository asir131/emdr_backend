import { Response, NextFunction } from 'express';
import { categoryService, mediaService } from './category.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const categoryController = {
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.create(req.user!.userId, req.body.categoryName), 201); }
    catch (e) { next(e); }
  },
  list: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.list()); }
    catch (e) { next(e); }
  },
  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.getById(req.params.id)); }
    catch (e) { next(e); }
  },
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.update(req.params.id, req.body)); }
    catch (e) { next(e); }
  },
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.delete(req.params.id)); }
    catch (e) { next(e); }
  },
};

export const mediaController = {
  upload: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new Error('No file uploaded');
      const { categoryId, name, status = 'active' } = req.body;
      ok(res, await mediaService.upload(req.user!.userId, categoryId, name, status, req.file), 201);
    } catch (e) { next(e); }
  },
  list: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, categoryId, status } = req.query as any;
      ok(res, await mediaService.list({ page: +page, limit: +limit, categoryId, status }));
    } catch (e) { next(e); }
  },
  getById: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await mediaService.getById(req.params.id)); }
    catch (e) { next(e); }
  },
  update: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await mediaService.update(req.params.id, req.body)); }
    catch (e) { next(e); }
  },
  delete: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await mediaService.delete(req.params.id)); }
    catch (e) { next(e); }
  },
};
