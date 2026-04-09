import { Router } from 'express';
import { supportController as ctrl } from './support.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createTicketSchema,
  respondTicketSchema,
  idParamSchema,
  adminQuerySchema,
} from './support.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: User Support Tickets and Complaints
 */

// ── USER ROUTES ───────────────────────────────────────────

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Submit a support ticket/complaint
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, message]
 *             properties:
 *               category: { type: string, example: "Technical Issue" }
 *               message: { type: string, example: "I cannot update my profile picture." }
 *               priority: { type: string, enum: [low, medium, high], default: medium }
 *     responses:
 *       201:
 *         description: Ticket submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, example: "60d0fe4f5311236168a109ca" }
 *                     userId: { type: string, example: "60d0fe2f5311236168a109c9" }
 *                     category: { type: string, example: "Technical Issue" }
 *                     message: { type: string, example: "I cannot update my profile picture." }
 *                     status: { type: string, example: "open" }
 *                     priority: { type: string, example: "medium" }
 *                     createdAt: { type: string, example: "2023-10-01T10:00:00Z" }
 */
router.post('/tickets', authenticate, validate(createTicketSchema), ctrl.create);

/**
 * @swagger
 * /api/support/tickets/my:
 *   get:
 *     summary: Get my support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string, example: "60d0fe4f5311236168a109ca" }
 *                       category: { type: string, example: "General" }
 *                       status: { type: string, example: "resolved" }
 *                       adminResponse: { type: string, example: "Your issue has been fixed." }
 */
router.get('/tickets/my', authenticate, ctrl.getMyTickets);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   get:
 *     summary: Get ticket details by ID
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ticket details retrieved
 */
router.get('/tickets/:id', authenticate, validate(idParamSchema), ctrl.getById);

// ── ADMIN ROUTES ──────────────────────────────────────────

// All routes below require Admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/support/admin/tickets:
 *   get:
 *     summary: Get all support tickets (Admin Only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in-progress, resolved, closed] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string, example: "60d0fe4f5311236168a109ca" }
 *                           userId: { type: object, properties: { firstName: { type: string, example: "John" }, email: { type: string, example: "john@example.com" } } }
 *                           category: { type: string, example: "Billing" }
 *                           status: { type: string, example: "open" }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer, example: 50 }
 *                         totalPages: { type: integer, example: 5 }
 */
router.get('/admin/tickets', validate(adminQuerySchema), ctrl.getAllAdmin);

/**
 * @swagger
 * /api/support/admin/tickets/{id}:
 *   patch:
 *     summary: Respond to a support ticket (Admin Only)
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [response]
 *             properties:
 *               response: { type: string, example: "We have fixed the issue. Please try again." }
 *               status: { type: string, enum: [in-progress, resolved, closed], default: resolved }
 *     responses:
 *       200:
 *         description: Ticket updated with response
 */
router.patch('/admin/tickets/:id', validate(respondTicketSchema), ctrl.respond);

export default router;
