import { Router } from 'express';
import { aboutController as ctrl } from './about.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { aboutUsSchema } from './about.validation';

const router = Router();

// PUBLIC
router.get('/', ctrl.get);

// ADMIN ONLY
router.post('/', authenticate, requireAdmin, validate(aboutUsSchema), ctrl.create);
router.put('/',  authenticate, requireAdmin, validate(aboutUsSchema), ctrl.update);

export default router;
