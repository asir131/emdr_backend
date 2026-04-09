import { Router } from 'express';
import { aboutController as ctrl } from './about.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { aboutUsSchema } from './about.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: About
 *   description: CMS - About Us Content
 */

/**
 * @swagger
 * /api/about:
 *   get:
 *     summary: Get About Us information
 *     tags: [About]
 *     responses:
 *       200:
 *         description: About Us content retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview: { type: string, example: "<h1>Welcome to MY-EMDR</h1><p>We are a <b>leading</b> health platform.</p>" }
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string, example: "Our Mission" }
 *                           content: { type: string, example: "<ul><li>Accessible therapy.</li><li>Scientifically backed tools.</li></ul>" }
 *                           order: { type: integer, example: 1 }
 */
router.get('/', ctrl.get);

// ADMIN ONLY

/**
 * @swagger
 * /api/about:
 *   post:
 *     summary: Create About Us content (Admin Only)
 *     tags: [About]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overview, sections]
 *             properties:
 *               overview: { type: string, example: "<h1>Welcome</h1><p>Our journey began in 2023.</p>" }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [title, content, order]
 *                   properties:
 *                     title: { type: string, example: "Our Story" }
 *                     content: { type: string, example: "<p>We started with a <i>simple</i> vision.</p>" }
 *                     order: { type: integer, example: 1 }
 *     responses:
 *       201:
 *         description: Content created
 */
router.post('/', authenticate, requireAdmin, validate(aboutUsSchema), ctrl.create);

/**
 * @swagger
 * /api/about:
 *   put:
 *     summary: Update About Us content (Admin Only)
 *     tags: [About]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [overview, sections]
 *             properties:
 *               overview: { type: string, example: "<h2>Updated Mission</h2><p>Refined for 50+ countries.</p>" }
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [title, content, order]
 *                   properties:
 *                     title: { type: string, example: "Global Impact" }
 *                     content: { type: string, example: "<p>Expanding to <u>multilingual</u> support.</p>" }
 *                     order: { type: integer, example: 2 }
 *     responses:
 *       200:
 *         description: Content updated
 */
router.put('/',  authenticate, requireAdmin, validate(aboutUsSchema), ctrl.update);

export default router;
