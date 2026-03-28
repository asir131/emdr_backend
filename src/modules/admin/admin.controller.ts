import { Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AuthRequest } from '../../middleware/authMiddleware';
import { uploadProfilePic } from '../../middleware/upload';
import { ApiError } from '../../utils/ApiError';

const respond = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });

export const adminController = {

  // GET /admin/profile
  getProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await adminService.getProfile(req.user!.userId));
    } catch (e) { next(e); }
  },

  // PATCH /admin/profile  — multipart/form-data
  updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    uploadProfilePic(req as any, res, async (err) => {
      try {
        if (err) return next(err);

        const { name, phoneNumber } = req.body;
        if (!name) return next(ApiError.validationError('name is required', 'name'));

        const profilePicBuffer = (req as any).file?.buffer;
        const data = await adminService.updateProfile(
          req.user!.userId,
          { name, phoneNumber },
          profilePicBuffer
        );
        respond(res, data);
      } catch (e) { next(e); }
    });
  },
};
