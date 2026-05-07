import { Router } from 'express';
import { exposureController as ctrl } from './exposure.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { createPlanSchema, updateStepSchema, idParamSchema } from './exposure.validation';
import weeklyReviewRoutes from './weeklyReview.routes';
import { weeklyReviewController } from './weeklyReview.controller';
import { saveReviewSchemaAuto, updateStepReviewSchemaAuto } from './weeklyReview.validation';

const router = Router();

router.use(authenticate);

router.get('/behaviors', ctrl.getBehaviors);
router.post('/plan', validate(createPlanSchema), ctrl.createPlan);
router.get('/plans', ctrl.getUserPlans);
router.get('/plan/:id', validate(idParamSchema), ctrl.getPlan);
router.patch('/plan/:id/step', validate(updateStepSchema), ctrl.updateStep);
router.get('/plan/:id/progress', validate(idParamSchema), ctrl.getProgress);
router.delete('/plan/:id', validate(idParamSchema), ctrl.deletePlan);

// Weekly review routes WITH planId
router.use('/plan/:id/weekly-review', weeklyReviewRoutes);

// NEW: Weekly review routes WITHOUT planId (auto-detect active plan)
router.get('/weekly-review', weeklyReviewController.getCurrentForUser);
router.post('/weekly-review', validate(saveReviewSchemaAuto), weeklyReviewController.saveForUser);
router.patch('/weekly-review/step', validate(updateStepReviewSchemaAuto), weeklyReviewController.updateStepForUser);

export default router;
