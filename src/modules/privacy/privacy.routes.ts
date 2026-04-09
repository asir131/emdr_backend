import { Router } from 'express';
import { privacyController as ctrl } from './privacy.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createPrivacySchema, replacePrivacySchema,
  updatePrivacySchema, idParamSchema,
} from './privacy.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Privacy
 *   description: CMS - Privacy Policy Management
 */

// PUBLIC — no auth required

/**
 * @swagger
 * /api/privacy/active:
 *   get:
 *     summary: Get currently active Privacy Policy
 *     tags: [Privacy]
 *     responses:
 *       200:
 *         description: Active privacy policy content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, example: "60d0fe2f5311236168a10b15" }
 *                     overview: { type: string, example: "<p>We value your <b>privacy</b>. This policy explains how we handle your data.</p>" }
 *                     version: { type: string, example: "1.0.1" }
 *                     effectiveDate: { type: string, example: "2023-10-01T12:00:00Z" }
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string, example: "Data Collection" }
 *                           content: { type: string, example: "<ul><li>We collect email addresses.</li><li>We collect usage data.</li></ul>" }
 *                           order: { type: number, example: 1 }
 *                     isActive: { type: boolean, example: true }
 *                     updatedAt: { type: string, example: "2023-10-01T12:00:00Z" }
 */
router.get('/active', ctrl.getActive);

// ADMIN ONLY
/**
 * @swagger
 * /api/privacy:
 *   get:
 *     summary: Get all privacy policy versions (Admin Only)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of privacy policies
 */
router.use(authenticate, requireAdmin);

router.get('/',                    ctrl.getAll);

/**
 * @swagger
 * /api/privacy/{id}:
 *   get:
 *     summary: Get privacy policy by ID (Admin Only)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Privacy policy content retrieved
 */
router.get('/:id',                 validate(idParamSchema),       ctrl.getById);

/**
 * @swagger
 * /api/privacy:
 *   post:
 *     summary: Create new Privacy Policy version (Admin Only)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overview, version, sections, contactEmail, contactName]
 *             properties:
 *               version: { type: string, example: "1.0.2" }
 *               overview: { type: string, example: "<h3>Welcome</h3><p>This is the <i>new</i> version.</p>" }
 *               effectiveDate: { type: string, example: "2023-10-15T00:00:00Z" }
 *               changelog: { type: string, example: "Added detailed data retention section." }
 *               contactEmail: { type: string, example: "legal@myemdr.com" }
 *               contactName: { type: string, example: "Legal Team" }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string, example: "1. Data We Collect" }
 *                     content: { type: string, example: "<p>We collect <u>email</u> and <s>names</s>.</p>" }
 *                     order: { type: number, example: 0 }
 *     responses:
 *       201:
 *         description: Privacy policy created
 */
router.post('/',                   validate(createPrivacySchema),  ctrl.create);

/**
 * @swagger
 * /api/privacy/{id}:
 *   put:
 *     summary: Replace a privacy policy version (Admin Only)
 *     tags: [Privacy]
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
 *             required: [content, version]
 *             properties:
 *               content: { type: string }
 *               version: { type: string }
 *     responses:
 *       200:
 *         description: Privacy policy replaced
 */
router.put('/:id',                 validate(replacePrivacySchema), ctrl.replace);

/**
 * @swagger
 * /api/privacy/{id}:
 *   patch:
 *     summary: Partially update a privacy policy (Admin Only)
 *     tags: [Privacy]
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
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Privacy policy updated
 */
router.patch('/:id',               validate(updatePrivacySchema),  ctrl.update);

/**
 * @swagger
 * /api/privacy/{id}/activate:
 *   patch:
 *     summary: Set a privacy policy version as active (Admin Only)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Privacy policy activated
 */
router.patch('/:id/activate',      validate(idParamSchema),        ctrl.setActive);

/**
 * @swagger
 * /api/privacy/{id}:
 *   delete:
 *     summary: Delete a privacy policy version (Admin Only)
 *     tags: [Privacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Privacy policy deleted
 */
router.delete('/:id',              validate(idParamSchema),        ctrl.delete);

export default router;
