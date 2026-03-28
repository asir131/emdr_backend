import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';

const router = Router();

// All admin routes — must be authenticated + admin role
router.use(authenticate, requireAdmin);

router.get('/',   adminController.getProfile);
router.patch('/', adminController.updateProfile);

export default router;
