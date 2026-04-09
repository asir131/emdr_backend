import { Router } from 'express';
import { subscriptionController as ctrl } from './subscription.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  planIdSchema,
  createPlanSchema,
  updatePlanSchema,
  reviewRequestSchema,
} from './subscription.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription Plans and User Subscriptions
 */

// ── PUBLIC ROUTES ─────────────────────────────────────────

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get all active pricing plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of pricing plans
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
 *                       _id: { type: string, example: "60d0fe2f5311236168a10b18" }
 *                       name: { type: string, example: "The Main Plan" }
 *                       price: { type: number, example: 45 }
 *                       currency: { type: string, example: "£" }
 *                       interval: { type: string, example: "monthly" }
 *                       tagline: { type: string, example: "Affordable entry to virtual EMDR therapy" }
 *                       features: { type: array, items: { type: string }, example: ["Includes Prime Plan program", "Full virtual EMDR suite"] }
 */
router.get('/plans', ctrl.getPlans);

// ── USER ROUTES ───────────────────────────────────────────

router.use(authenticate);

/**
 * @swagger
 * /api/subscriptions/my:
 *   get:
 *     summary: Get my current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/my', ctrl.getMySubscription);

/**
 * @swagger
 * /api/subscriptions/subscribe:
 *   post:
 *     summary: Subscribe to a plan (Standard/Premium)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string, example: "60d0fe2f5311236168a10b18" }
 *     responses:
 *       201:
 *         description: Subscribed successfully
 */
router.post('/subscribe', validate(planIdSchema), ctrl.subscribe);

/**
 * @swagger
 * /api/subscriptions/apply:
 *   post:
 *     summary: Apply for Community Access (Free Plan)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string, example: "60d0fe2f5311236168a10b18" }
 *     responses:
 *       201:
 *         description: Application submitted
 */
router.post('/apply', validate(planIdSchema), ctrl.apply);

// ── ADMIN ROUTES ──────────────────────────────────────────

router.use(requireAdmin);

/**
 * @swagger
 * /api/subscriptions/admin/plans:
 *   get:
 *     summary: Get all subscription plans (Admin Only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all plans
 */
router.get('/admin/plans', ctrl.adminGetPlans);

/**
 * @swagger
 * /api/subscriptions/admin/plans:
 *   post:
 *     summary: Create a new subscription plan (Admin Only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, price, features, tagline, interval]
 *             properties:
 *               name: { type: string, example: "The Main Plan" }
 *               type: { type: string, enum: [standard, premium, community] }
 *               price: { type: number, example: 45 }
 *               interval: { type: string, enum: [monthly, yearly], example: "monthly" }
 *               tagline: { type: string, example: "Affordable entry to virtual EMDR therapy" }
 *               features: { type: array, items: { type: string }, example: ["Includes Prime Plan program", "Full virtual EMDR suite"] }
 *               isCommunityAccess: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Plan created
 */
router.post('/admin/plans', validate(createPlanSchema), ctrl.adminCreatePlan);

/**
 * @swagger
 * /api/subscriptions/admin/plans/{id}:
 *   put:
 *     summary: Update a subscription plan (Admin Only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "The Main Plan" }
 *               tagline: { type: string, example: "Affordable entry to virtual EMDR therapy" }
 *               price: { type: number, example: 45 }
 *               interval: { type: string, enum: [monthly, yearly], example: "monthly" }
 *               features: { type: array, items: { type: string } }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.put('/admin/plans/:id', validate(updatePlanSchema), ctrl.adminUpdatePlan);

/**
 * @swagger
 * /api/subscriptions/admin/requests:
 *   get:
 *     summary: Get all Community Access requests (Admin Only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscription requests
 */
router.get('/admin/requests', ctrl.adminGetRequests);

/**
 * @swagger
 * /api/subscriptions/admin/requests/{id}:
 *   patch:
 *     summary: Review a Community Access request (Admin Only)
 *     tags: [Subscriptions]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Request reviewed and status updated
 */
router.patch('/admin/requests/:id', validate(reviewRequestSchema), ctrl.adminReviewRequest);

export default router;
