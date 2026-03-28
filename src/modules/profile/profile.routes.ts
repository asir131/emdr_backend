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

router.get('/',                   profileController.getProfile.bind(profileController));
router.patch('/',                 profileController.updateProfile.bind(profileController));
router.patch('/change-password',  passwordChangeLimiter, validate(changePasswordSchema), profileController.changePassword.bind(profileController));
router.delete('/',                profileController.deleteAccount.bind(profileController));

export default router;
