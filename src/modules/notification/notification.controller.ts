import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

const svc = notificationService;

export const notificationController = {

  registerToken: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { fcmToken, platform } = req.body;
      const data = await svc.registerToken(req.user!.userId, fcmToken, platform);
      sendSuccess(res, { message: 'FCM token registered', user: data });
    } catch (e) { next(e); }
  },

  removeToken: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await svc.removeToken(req.user!.userId);
      sendSuccess(res, { message: 'FCM token removed' });
    } catch (e) { next(e); }
  },

  sendToUser: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, ...payload } = req.body;
      const data = await svc.sendToUser(userId, payload);
      sendSuccess(res, { message: 'Notification sent', ...data });
    } catch (e) { next(e); }
  },

  broadcast: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role, ...payload } = req.body;
      const data = await svc.broadcast(payload, role);
      sendSuccess(res, { message: 'Broadcast sent', ...data });
    } catch (e) { next(e); }
  },

  sendToTopic: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { topic, ...payload } = req.body;
      const result = await svc.sendToTopic(topic, payload);
      sendSuccess(res, { message: 'Topic notification sent', messageId: result });
    } catch (e) { next(e); }
  },

  getMyNotifications: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
      const data = await svc.getMyNotifications(req.user!.userId, +page, +limit);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  markAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = await svc.markAsRead(req.user!.userId, req.params.id);
      sendSuccess(res, data);
    } catch (e) { next(e); }
  },

  deleteNotification: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await svc.deleteNotification(req.user!.userId, req.params.id);
      sendSuccess(res, { message: 'Notification deleted' });
    } catch (e) { next(e); }
  },
};
