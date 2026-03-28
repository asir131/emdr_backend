import { Router } from 'express';
import { termsController as ctrl } from './terms.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createTermsSchema, updateTermsSchema, replaceTermsSchema,
  idParamSchema, acceptTermsSchema,
} from './terms.validation';

const router = Router();

// ── PUBLIC ────────────────────────────────────────────────
router.get('/active', ctrl.getActive);

// ── AUTHENTICATED USER ────────────────────────────────────
router.post('/accept',            authenticate, validate(acceptTermsSchema), ctrl.acceptTerms);
router.get('/acceptance/status',  authenticate, ctrl.checkAcceptance);

// ── ADMIN ONLY ────────────────────────────────────────────
router.use(authenticate, requireAdmin);

router.get('/',                        ctrl.getAll);
router.get('/:id',                     validate(idParamSchema), ctrl.getById);
router.get('/:id/stats',               validate(idParamSchema), ctrl.getAcceptanceStats);
router.post('/',                       validate(createTermsSchema), ctrl.create);
router.put('/:id',                     validate(replaceTermsSchema), ctrl.replace);
router.patch('/:id',                   validate(updateTermsSchema), ctrl.update);
router.patch('/:id/activate',          validate(idParamSchema), ctrl.setActive);
router.delete('/:id',                  validate(idParamSchema), ctrl.delete);

export default router;
