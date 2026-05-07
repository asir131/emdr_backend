import { Router } from 'express';
import { journeyController as ctrl } from './journey.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { createJourneySchema, updateJourneySchema, idParamSchema } from './journey.validation';

const router = Router();

router.use(authenticate);

// User routes - shows only logged-in user's journeys
router.get('/', ctrl.list);
router.get('/:id', validate(idParamSchema), ctrl.getById);
router.post('/', validate(createJourneySchema), ctrl.create);
router.put('/:id', validate(updateJourneySchema), ctrl.update);
router.delete('/:id', validate(idParamSchema), ctrl.delete);

// Admin route - shows all journeys (optional, if needed)
// router.get('/admin/all', requireAdmin, ctrl.listAll);

export default router;
