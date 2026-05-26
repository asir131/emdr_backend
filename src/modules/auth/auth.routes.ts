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
  rateLimit({
    windowMs, max, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: msg } }
  });

const signupLimiter = mkLimiter(10, 10 * 60 * 1000, 'Too many signup attempts');
const otpLimiter = mkLimiter(10, 10 * 60 * 1000, 'Too many OTP attempts');
const loginLimiter = mkLimiter(500000000000, 15 * 60 * 1000, 'Too many login attempts');
const googleLimiter = mkLimiter(20, 15 * 60 * 1000, 'Too many Google auth attempts');

const ctrl = authController;

router.post('/signup', signupLimiter, validate(signupSchema), ctrl.signup.bind(ctrl));
router.post('/login', loginLimiter, validate(loginSchema), ctrl.login.bind(ctrl));
router.post('/google', googleLimiter, validate(googleAuthSchema), ctrl.googleAuth.bind(ctrl));
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), ctrl.verifyOTP.bind(ctrl));
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), ctrl.resendOTP.bind(ctrl));
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword.bind(ctrl));
router.post('/send-verification-otp', otpLimiter, validate(sendVerificationOTPSchema), ctrl.sendVerificationOTP.bind(ctrl));
router.post('/recover-account', authenticate, otpLimiter, validate(recoverAccountSchema), ctrl.recoverAccount.bind(ctrl));
router.post('/verify-email-with-token', authenticate, otpLimiter, validate(verifyEmailWithTokenSchema), ctrl.verifyEmailWithToken.bind(ctrl));
router.post('/logout', authenticate, validate(logoutSchema), ctrl.logout.bind(ctrl));
router.post('/refresh-token', validate(refreshTokenSchema), ctrl.refreshToken.bind(ctrl));

export default router;
