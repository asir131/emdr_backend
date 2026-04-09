import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { changePasswordSchema } from './profile.validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate limit for password change — 5 attempts per 15 min
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many password change attempts. Try again later.' } },
});

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User Profile Management
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
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
 *                     email: { type: string, example: "user@example.com" }
 *                     firstName: { type: string, example: "John" }
 *                     lastName: { type: string, example: "Doe" }
 *                     role: { type: string, example: "user" }
 *                     isEmailVerified: { type: boolean, example: true }
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         status: { type: string, example: "active" }
 *                         planId: { type: string, example: "60d0fe2f5311236168a10b22" }
 *                         endDate: { type: string, example: "2024-10-01T12:00:00Z" }
 */
router.get('/',                   profileController.getProfile.bind(profileController));

/**
 * @swagger
 * /api/profile:
 *   patch:
 *     summary: Update profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: "Jane" }
 *               lastName: { type: string, example: "Smith" }
 *     responses:
 *       200:
 *         description: Profile updated
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
 *                     firstName: { type: string, example: "Jane" }
 *                     lastName: { type: string, example: "Smith" }
 */
router.patch('/',                 profileController.updateProfile.bind(profileController));

/**
 * @swagger
 * /api/profile/change-password:
 *   patch:
 *     summary: Change account password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword: { type: string, example: "Old@1234" }
 *               newPassword: { type: string, example: "New@1234" }
 *               confirmPassword: { type: string, example: "New@1234" }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.patch('/change-password',  passwordChangeLimiter, validate(changePasswordSchema), profileController.changePassword.bind(profileController));

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete user account
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete('/',                profileController.deleteAccount.bind(profileController));

export default router;
