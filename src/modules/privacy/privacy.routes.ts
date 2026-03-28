import { Router } from 'express';
import { privacyController as ctrl } from './privacy.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createPrivacySchema, replacePrivacySchema,
  updatePrivacySchema, idParamSchema,
} from './privacy.validation';

const router = Router();

// PUBLIC — no auth required
router.get('/active', ctrl.getActive);

// ADMIN ONLY
router.use(authenticate, requireAdmin);

router.get('/',                    ctrl.getAll);
router.get('/:id',                 validate(idParamSchema),       ctrl.getById);
router.post('/',                   validate(createPrivacySchema),  ctrl.create);
router.put('/:id',                 validate(replacePrivacySchema), ctrl.replace);
router.patch('/:id',               validate(updatePrivacySchema),  ctrl.update);
router.patch('/:id/activate',      validate(idParamSchema),        ctrl.setActive);
router.delete('/:id',              validate(idParamSchema),        ctrl.delete);

export default router;
