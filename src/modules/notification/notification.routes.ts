import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { notificationController as ctrl } from './notification.controller';
import {
  registerTokenSchema, sendToUserSchema, broadcastSchema,
  topicSchema, paginationSchema, markReadSchema, deleteNotificationSchema,
} from './notification.validation';

const router = Router();

router.use(authenticate);

// User routes
router.post  ('/token',          validate(registerTokenSchema),      ctrl.registerToken);
router.delete('/token',                                               ctrl.removeToken);
router.get   ('/',               validate(paginationSchema),         ctrl.getMyNotifications);
router.patch ('/read-all',                                           ctrl.markAsRead);
router.patch ('/:id/read',       validate(markReadSchema),           ctrl.markAsRead);
router.delete('/:id',            validate(deleteNotificationSchema), ctrl.deleteNotification);

// Admin-only routes
router.post  ('/send/user',      requireAdmin, validate(sendToUserSchema),  ctrl.sendToUser);
router.post  ('/send/broadcast', requireAdmin, validate(broadcastSchema),   ctrl.broadcast);
router.post  ('/send/topic',     requireAdmin, validate(topicSchema),       ctrl.sendToTopic);

export default router;
