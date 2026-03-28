import { Router } from 'express';
import { locationController } from './location.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { shareLocationSchema } from './location.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(shareLocationSchema), locationController.share);
router.get('/',  locationController.getMyLocation);

export default router;
