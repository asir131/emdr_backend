import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatController as ctrl } from './chat.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// Rate limit — 30 messages per minute per user
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => req.user?.userId ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many messages. Slow down.' } },
});

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time Messaging and Support
 */

/**
 * @swagger
 * /api/chat/conversation:
 *   post:
 *     summary: Get or create a conversation with Admin/User
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, description: "Required for Admin to start chat with a user" }
 *     responses:
 *       200:
 *         description: Conversation retrieved/created
 */
router.post('/conversation', ctrl.getOrCreateConversation);

/**
 * @swagger
 * /api/chat/conversation/{conversationId}/send:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: "Hello!" }
 *               messageType: { type: string, enum: [text, image, file], default: "text" }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post  ('/conversation/:conversationId/send',     chatLimiter, ctrl.sendMessage);

/**
 * @swagger
 * /api/chat/conversation/{conversationId}/messages:
 *   get:
 *     summary: Get message history for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get   ('/conversation/:conversationId/messages',              ctrl.getMessages);

/**
 * @swagger
 * /api/chat/conversation/{conversationId}/unread:
 *   get:
 *     summary: Get unread message count
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get   ('/conversation/:conversationId/unread',                ctrl.getUnreadCount);

/**
 * @swagger
 * /api/chat/messages/{id}/me:
 *   delete:
 *     summary: Delete message for myself only
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message deleted for me
 */
router.delete('/messages/:id/me',                                    ctrl.deleteForMe);

/**
 * @swagger
 * /api/chat/messages/{id}/everyone:
 *   delete:
 *     summary: Unsend/Delete message for everyone
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message unsent successfully
 */
router.delete('/messages/:id/everyone',                              ctrl.deleteForEveryone);

/**
 * @swagger
 * /api/chat/admin/conversations:
 *   get:
 *     summary: Get all active conversations (Admin Only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get   ('/admin/conversations',   requireAdmin, ctrl.getAllConversations);

/**
 * @swagger
 * /api/chat/admin/messages/{id}:
 *   delete:
 *     summary: Permanently delete any message (Admin Only)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message deleted by admin
 */
router.delete('/admin/messages/:id',    requireAdmin, ctrl.adminDeleteMessage);

export default router;
