import { Router } from 'express';
import { termsController as ctrl } from './terms.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createTermsSchema, updateTermsSchema, replaceTermsSchema,
  idParamSchema, acceptTermsSchema,
} from './terms.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Terms
 *   description: CMS - Terms and Conditions Management
 */

// ── PUBLIC ────────────────────────────────────────────────

/**
 * @swagger
 * /api/terms/active:
 *   get:
 *     summary: Get currently active Terms and Conditions
 *     tags: [Terms]
 *     responses:
 *       200:
 *         description: Active terms content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, example: "60d0fe2f5311236168a10b18" }
 *                     version: { type: string, example: "2.1.0" }
 *                     lastUpdated: { type: string, example: "2023-10-01T12:00:00Z" }
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string, example: "User Obligations" }
 *                           content: { type: string, example: "<p>Users <b>must</b> keep their passwords <u>secure</u> at all times.</p>" }
 *                           order: { type: number, example: 0 }
 *                     isActive: { type: boolean, example: true }
 */
router.get('/active', ctrl.getActive);

// ── AUTHENTICATED USER ────────────────────────────────────

/**
 * @swagger
 * /api/terms/accept:
 *   post:
 *     summary: Accept terms for the current user
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termsId]
 *             properties:
 *               termsId: { type: string, example: "60d0fe2f5311236168a10b18" }
 *     responses:
 *       200:
 *         description: Terms accepted
 */
router.post('/accept',            authenticate, validate(acceptTermsSchema), ctrl.acceptTerms);

/**
 * @swagger
 * /api/terms/acceptance/status:
 *   get:
 *     summary: Check if user has accepted the latest terms
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceptance status retrieved
 */
router.get('/acceptance/status',  authenticate, ctrl.checkAcceptance);

// ── ADMIN ONLY ────────────────────────────────────────────

/**
 * @swagger
 * /api/terms:
 *   get:
 *     summary: Get all terms versions (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of terms
 */
router.use(authenticate, requireAdmin);

router.get('/',                        ctrl.getAll);

/**
 * @swagger
 * /api/terms/{id}:
 *   get:
 *     summary: Get terms by ID (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Terms content retrieved
 */
router.get('/:id',                     validate(idParamSchema), ctrl.getById);

/**
 * @swagger
 * /api/terms/{id}/stats:
 *   get:
 *     summary: Get acceptance statistics for a terms version (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stats retrieved
 */
router.get('/:id/stats',               validate(idParamSchema), ctrl.getAcceptanceStats);

/**
 * @swagger
 * /api/terms:
 *   post:
 *     summary: Create new Terms version (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version, sections, contactEmail, contactName]
 *             properties:
 *               version: { type: string, example: "2.1.1" }
 *               changelog: { type: string, example: "Updated refund policy section." }
 *               contactEmail: { type: string, example: "support@myemdr.com" }
 *               contactName: { type: string, example: "Support Team" }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string, example: "1. Introduction" }
 *                     content: { type: string, example: "<h1>Welcome</h1><p>This is formatted with <b>HTML</b> tags.</p>" }
 *                     order: { type: number, example: 0 }
 *     responses:
 *       201:
 *         description: Terms created
 */
router.post('/',                       validate(createTermsSchema), ctrl.create);

/**
 * @swagger
 * /api/terms/{id}:
 *   put:
 *     summary: Replace a terms version (Admin Only)
 *     tags: [Terms]
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
 *             required: [version, sections, contactEmail, contactName]
 *             properties:
 *               version: { type: string, example: "2.1.2" }
 *               sections:
 *                 type: array
 *                 items:
 *                    type: object
 *                    properties:
 *                      title: { type: string, example: "Updated Section" }
 *                      content: { type: string, example: "<p>Updated <i>rich text</i> content.</p>" }
 *                      order: { type: number, example: 0 }
 *               contactEmail: { type: string, example: "updated@myemdr.com" }
 *               contactName: { type: string, example: "Updated Team" }
 *     responses:
 *       200:
 *         description: Terms replaced
 */
router.put('/:id',                     validate(replaceTermsSchema), ctrl.replace);

/**
 * @swagger
 * /api/terms/{id}:
 *   patch:
 *     summary: Partially update a terms version (Admin Only)
 *     tags: [Terms]
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
 *         description: Terms updated
 */
router.patch('/:id',                   validate(updateTermsSchema), ctrl.update);

/**
 * @swagger
 * /api/terms/{id}/activate:
 *   patch:
 *     summary: Set a terms version as active (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Terms activated
 */
router.patch('/:id/activate',          validate(idParamSchema), ctrl.setActive);

/**
 * @swagger
 * /api/terms/{id}:
 *   delete:
 *     summary: Delete a terms version (Admin Only)
 *     tags: [Terms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Terms deleted
 */
router.delete('/:id',                  validate(idParamSchema), ctrl.delete);

export default router;
