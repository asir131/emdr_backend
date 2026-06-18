import { Response, NextFunction } from 'express';
import { categoryService, mediaService } from './category.service';
import { AuthRequest } from '../../middleware/authMiddleware';

const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

const parseJsonField = (value: unknown) => {
  if (typeof value !== 'string') return value;
  if (!value.trim()) return undefined;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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
  getCategoryMedia: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try { ok(res, await categoryService.getCategoryMedia(req.params.id)); }
    catch (e) { next(e); }
  },
};

export const mediaController = {
  upload: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const mainFile = files?.['image']?.[0] ?? (req.file as Express.Multer.File | undefined);
      if (!mainFile) throw new Error('No file uploaded');

      const { categoryId, name, status = 'active', defaultFacing } = req.body;
      const bilateralAudioProfile = parseJsonField(req.body.bilateralAudioProfile);

      const profileFiles = {
        imageProfile: files?.['imageProfile']?.[0],
        videoProfile: files?.['videoProfile']?.[0],
        musicProfile: files?.['musicProfile']?.[0],
      };

      ok(res, await mediaService.upload(
        req.user!.userId, categoryId, name, status, mainFile, profileFiles, bilateralAudioProfile, defaultFacing
      ), 201);
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
