import { Router } from 'express';
import { faqController as ctrl } from './faq.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { createFaqSchema, updateFaqSchema, idParamSchema, reorderSchema } from './faq.validation';

const router = Router();

// PUBLIC — no auth required
router.get('/',     ctrl.getAll);
router.get('/:id',  validate(idParamSchema), ctrl.getById);

// ADMIN ONLY
router.use(authenticate, requireAdmin);

router.get('/admin/all',  ctrl.getAllAdmin);
router.post('/',          validate(createFaqSchema),  ctrl.create);
router.patch('/reorder',  validate(reorderSchema),    ctrl.reorder);
router.patch('/:id',      validate(updateFaqSchema),  ctrl.update);
router.delete('/:id',     validate(idParamSchema),    ctrl.delete);

export default router;
