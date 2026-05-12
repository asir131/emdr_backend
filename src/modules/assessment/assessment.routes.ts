import { Router } from 'express';
import { assessmentController as ctrl } from './assessment.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { requireSubscription } from '../../middleware/requireSubscription';
import { validate } from '../../middleware/validate';
import { phq9Schema, gad7Schema, des11Schema, assessmentSchema, statusUpdateSchema } from './assessment.validation';

const router = Router();

router.use(authenticate);

// 3-Stage Assessment Submission
router.post('/phq9',  validate(phq9Schema),  ctrl.submitPhq9);
router.post('/gad7',  validate(gad7Schema),  ctrl.submitGad7);
router.post('/des11', validate(des11Schema), ctrl.submitDes11);

// Standard Full Assessment Submission
router.post('/submit', validate(assessmentSchema), ctrl.submitFull);

// Get result - requires active subscription (free or paid)
router.get('/result', requireSubscription, ctrl.getResult);

// Admin only - Update assessment status
router.patch('/status', requireAdmin, validate(statusUpdateSchema), ctrl.updateStatus);

export default router;
