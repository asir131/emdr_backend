import { Router } from 'express';
import { onboardingController as ctrl } from './onboarding.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { profileStepSchema, safetyCheckSchema, consentSchema } from './onboarding.validation';

const router = Router();

router.use(authenticate);

router.get('/status',       ctrl.getStatus);
router.post('/profile',     validate(profileStepSchema),  ctrl.saveProfile);
router.post('/safety-check',validate(safetyCheckSchema),  ctrl.saveSafetyCheck);
router.post('/consent',     validate(consentSchema),       ctrl.saveConsent);

export default router;
