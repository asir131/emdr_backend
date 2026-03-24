import { Router } from 'express';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { notificationController as ctrl } from './notification.controller';
import {
  registerTokenSchema, sendToUserSchema, broadcastSchema,
  topicSchema, paginationSchema, markReadSchema,
} from './notification.validation';

const router = Router();
    
// ── All routes require authentication ──────────────────────────────────────
router.use(authenticate);

// ── Device token management ─────────────────────────────────────────────────
router.post  ('/token',         validate(registerTokenSchema), ctrl.registerToken);
router.delete('/token',                                        ctrl.removeToken);

// ── User: read own notifications ────────────────────────────────────────────
router.get   ('/',              validate(paginationSchema),    ctrl.getMyNotifications);
router.patch ('/read-all',                                     ctrl.markAsRead);
router.patch ('/:id/read',      validate(markReadSchema),      ctrl.markAsRead);
router.delete('/:id',           validate(markReadSchema),      ctrl.deleteNotification);

// ── Admin: send notifications ───────────────────────────────────────────────
router.post  ('/send/user',     validate(sendToUserSchema),    ctrl.sendToUser);
router.post  ('/send/broadcast',validate(broadcastSchema),     ctrl.broadcast);
router.post  ('/send/topic',    validate(topicSchema),         ctrl.sendToTopic);

export default router;
