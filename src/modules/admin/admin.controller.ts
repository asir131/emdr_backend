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

  getDashboardStats: async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      respond(res, await adminService.getDashboardStats());
    } catch (e) { next(e); }
  },

  // PATCH /admin/profile — multipart/form-data
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

  // GET /admin/users?page=1&limit=10&search=john
  getAllUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const data = await adminService.getAllUsers(
        Number(page) || 1,
        Number(limit) || 10,
        (search as string) || ''
      );
      respond(res, data);
    } catch (e) { next(e); }
  },

  // GET /admin/users/:userId
  getUserDetails: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      respond(res, await adminService.getUserDetails(userId));
    } catch (e) { next(e); }
  },

  // PATCH /admin/users/:userId/status
  updateUserStatus: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      if (!['active', 'suspended'].includes(status)) {
        throw ApiError.validationError('Invalid status', 'status');
      }
      respond(res, await adminService.updateUserStatus(userId, status));
    } catch (e) { next(e); }
  },

  // GET /admin/users/free?page=1&limit=10&search=john
  getFreeUsers: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const data = await adminService.getFreeUsers(
        Number(page) || 1,
        Number(limit) || 10,
        (search as string) || ''
      );
      respond(res, data);
    } catch (e) { next(e); }
  },

  // GET /admin/users/:userId/assessments
  getUserAssessments: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      respond(res, await adminService.getUserAssessments(userId));
    } catch (e) { next(e); }
  },
};
