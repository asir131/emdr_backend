import { Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { AuthRequest } from '../../middleware/authMiddleware';
import { uploadProfilePic } from '../../middleware/upload';
import { ApiError } from '../../utils/ApiError';

export class ProfileController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await profileService.getProfile(userId);
      res.status(200).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    uploadProfilePic(req as any, res, async (err) => {
      try {
        if (err) return next(err);

        const userId = req.user!.userId;
        const { fullName, phoneNumber } = req.body;

        if (!fullName) {
          return next(ApiError.validationError('fullName is required', 'fullName'));
        }

        const profilePicBuffer = (req as any).file?.buffer;
        const data = await profileService.updateProfile(userId, fullName, phoneNumber, profilePicBuffer);
        res.status(200).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    });
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await profileService.deleteAccount(userId);
      res.status(200).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;
      const data = await profileService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
