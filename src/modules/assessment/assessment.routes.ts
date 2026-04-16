import { Router } from 'express';
import { assessmentController as ctrl } from './assessment.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { assessmentSchema } from './assessment.validation';

const router = Router();

router.use(authenticate);

router.post('/submit', validate(assessmentSchema), ctrl.submit);
router.get('/result',  ctrl.getResult);

export default router;
