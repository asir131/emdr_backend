import { Router } from 'express';
import { weeklyReviewController as ctrl } from './weeklyReview.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  idParamSchema,
  saveReviewSchema,
  updateStepReviewSchema,
} from './weeklyReview.validation';

const router = Router({ mergeParams: true }); // mergeParams to access :id from parent

router.use(authenticate);

// GET  /api/exposure/plan/:id/weekly-review         → load current week's review + plan data
router.get('/', validate(idParamSchema), ctrl.getCurrent);

// POST /api/exposure/plan/:id/weekly-review         → save completed review session
router.post('/', validate(saveReviewSchema), ctrl.save);

// PATCH /api/exposure/plan/:id/weekly-review/step   → update a single step in real-time
router.patch('/step', validate(updateStepReviewSchema), ctrl.updateStep);

// GET  /api/exposure/plan/:id/weekly-review/history → all past reviews
router.get('/history', validate(idParamSchema), ctrl.getHistory);

export default router;
