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

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Push Notifications and User Alerts
 */

// User routes

/**
 * @swagger
 * /api/notifications/token:
 *   post:
 *     summary: Register FCM token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken, platform]
 *             properties:
 *               fcmToken: { type: string, example: "FCM-TOKEN-XXXX" }
 *               platform: { type: string, enum: [android, ios, web], example: "android" }
 *     responses:
 *       200:
 *         description: Token registered
 */
router.post  ('/token',          validate(registerTokenSchema),      ctrl.registerToken);

/**
 * @swagger
 * /api/notifications/token:
 *   delete:
 *     summary: Remove registered FCM token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token removed
 */
router.delete('/token',                                               ctrl.removeToken);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notification history
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string, example: "60d0fe2f5311236168a10b18" }
 *                           title: { type: string, example: "New Message" }
 *                           body: { type: string, example: "You have a new message from Support." }
 *                           isRead: { type: boolean, example: false }
 *                           createdAt: { type: string, example: "2023-10-01T12:00:00Z" }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer, example: 5 }
 *                         totalPages: { type: integer, example: 1 }
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 20 }
 */
router.get   ('/',               validate(paginationSchema),         ctrl.getMyNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "All notifications marked as read" }
 */
router.patch ('/read-all',                                           ctrl.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Notification marked as read" }
 */
router.patch ('/:id/read',       validate(markReadSchema),           ctrl.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id',            validate(deleteNotificationSchema), ctrl.deleteNotification);

// Admin-only routes

/**
 * @swagger
 * /api/notifications/send/user:
 *   post:
 *     summary: Send notification to a specific user (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, body]
 *             properties:
 *               userId: { type: string, example: "60d0fe4f5311236168a109ca" }
 *               title: { type: string, example: "Hello User" }
 *               body: { type: string, example: "This is a private update." }
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post  ('/send/user',      requireAdmin, validate(sendToUserSchema),  ctrl.sendToUser);

/**
 * @swagger
 * /api/notifications/send/broadcast:
 *   post:
 *     summary: Broadcast notification to all users (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, body]
 *             properties:
 *               title: { type: string, example: "App Update" }
 *               body: { type: string, example: "We have new features!" }
 *     responses:
 *       200:
 *         description: Broadcast sent
 */
router.post  ('/send/broadcast', requireAdmin, validate(broadcastSchema),   ctrl.broadcast);

/**
 * @swagger
 * /api/notifications/send/topic:
 *   post:
 *     summary: Send notification to a topic (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, title, body]
 *             properties:
 *               topic: { type: string, example: "news" }
 *               title: { type: string, example: "Breaking News" }
 *               body: { type: string, example: "Something happened." }
 *     responses:
 *       200:
 *         description: Topic notification sent
 */
router.post  ('/send/topic',     requireAdmin, validate(topicSchema),       ctrl.sendToTopic);

export default router;
