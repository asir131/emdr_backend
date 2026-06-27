import { Router } from 'express';
import { sessionProgressController as ctrl } from './sessionProgress.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  updateSessionProgressSchema,
  getSessionProgressSchema,
  markRoadmapIntroCompletedSchema,
} from './sessionProgress.validation';

const router = Router();

router.use(authenticate);

// Update progress with manual counts
router.post('/update', validate(updateSessionProgressSchema), ctrl.update);

// Mark the one-time roadmap intro video as completed
router.patch(
  '/:journeyId/roadmap-intro-video',
  validate(markRoadmapIntroCompletedSchema),
  ctrl.markRoadmapIntroCompleted
);

// Get progress for a specific journey
router.get('/:journeyId', validate(getSessionProgressSchema), ctrl.get);

export default router;
