import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authMiddleware';
import {
  signupSchema, loginSchema, verifyOtpSchema, resendOtpSchema,
  forgotPasswordSchema, recoverAccountSchema, sendVerificationOTPSchema,
  verifyEmailWithTokenSchema, logoutSchema, refreshTokenSchema, googleAuthSchema,
} from './auth.validation';
import rateLimit from 'express-rate-limit';

const router = Router();

const mkLimiter = (max: number, windowMs: number, msg: string) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: msg } } });

const signupLimiter = mkLimiter(10,  10 * 60 * 1000, 'Too many signup attempts');
const otpLimiter    = mkLimiter(10, 10 * 60 * 1000, 'Too many OTP attempts');
const loginLimiter  = mkLimiter(10, 15 * 60 * 1000, 'Too many login attempts');
const googleLimiter = mkLimiter(20, 15 * 60 * 1000, 'Too many Google auth attempts');

const ctrl = authController;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and Account Management
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, confirmPassword, isAcceptPrivacyStatement]
 *             properties:
 *               firstName: { type: string, example: "John" }
 *               lastName: { type: string, example: "Doe" }
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Test@1234" }
 *               confirmPassword: { type: string, example: "Test@1234" }
 *               isAcceptPrivacyStatement: { type: boolean, example: true }
 *     responses:
 *       201:
 *         description: User registered successfully. Returns registered user info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "User registered successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, example: "60d0fe2f5311236168a10b18" }
 *                     email: { type: string, example: "john@example.com" }
 *                     firstName: { type: string, example: "John" }
 *                     lastName: { type: string, example: "Doe" }
 *       400:
 *         description: Validation error
 */
router.post('/signup',                signupLimiter, validate(signupSchema),                ctrl.signup.bind(ctrl));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Test@1234" }
 *     responses:
 *       200:
 *         description: Login successful. Returns tokens and user info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *                     refreshToken: { type: string, example: "XyZ123..." }
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string, example: "60d0fe2f5311236168a10b18" }
 *                         email: { type: string, example: "john@example.com" }
 *                         role: { type: string, example: "user" }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',                 loginLimiter,  validate(loginSchema),                 ctrl.login.bind(ctrl));
/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth authentication
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string, example: "G-TOKEN-XXXX" }
 *     responses:
 *       200:
 *         description: Google login successful. Returns tokens and user info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR..." }
 *                     user: { type: object, properties: { email: { type: string, example: "user@gmail.com" } } }
 */
router.post('/google',                googleLimiter, validate(googleAuthSchema),             ctrl.googleAuth.bind(ctrl));

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP during signup/login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: OTP verified. Returns session tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: "eyJ..." }
 */
router.post('/verify-otp',            otpLimiter,    validate(verifyOtpSchema),              ctrl.verifyOTP.bind(ctrl));

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *     responses:
 *       200:
 *         description: OTP resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OTP resent successfully" }
 */
router.post('/resend-otp',            otpLimiter,    validate(resendOtpSchema),              ctrl.resendOTP.bind(ctrl));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *     responses:
 *       200:
 *         description: Reset OTP sent
 */
router.post('/forgot-password',       otpLimiter,    validate(forgotPasswordSchema),         ctrl.forgotPassword.bind(ctrl));

/**
 * @swagger
 * /api/auth/send-verification-otp:
 *   post:
 *     summary: Send verification OTP manually
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/send-verification-otp', otpLimiter,    validate(sendVerificationOTPSchema),    ctrl.sendVerificationOTP.bind(ctrl));

/**
 * @swagger
 * /api/auth/recover-account:
 *   post:
 *     summary: Set new password after recovery
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword, confirmPassword]
 *             properties:
 *               newPassword: { type: string, example: "New@1234" }
 *               confirmPassword: { type: string, example: "New@1234" }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/recover-account',       authenticate,  otpLimiter, validate(recoverAccountSchema),      ctrl.recoverAccount.bind(ctrl));

/**
 * @swagger
 * /api/auth/verify-email-with-token:
 *   post:
 *     summary: Verify email using token/otp
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email-with-token', authenticate, otpLimiter, validate(verifyEmailWithTokenSchema), ctrl.verifyEmailWithToken.bind(ctrl));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout from account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "REFRESH-TOKEN-XXXX" }
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout',                authenticate,  validate(logoutSchema),                ctrl.logout.bind(ctrl));

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "REFRESH-TOKEN-XXXX" }
 *     responses:
 *       200:
 *         description: Token refreshed. Returns new access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string, example: "eyJ..." }
 */
router.post('/refresh-token',                        validate(refreshTokenSchema),           ctrl.refreshToken.bind(ctrl));

export default router;
