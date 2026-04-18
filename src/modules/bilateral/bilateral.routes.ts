import { Router } from 'express';
import { settingsController } from './bilateral.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { saveSettingsSchema } from './bilateral.validation';

const router = Router();

router.use(authenticate);

// ── Full config + user settings only ─────────────────────────────────────
router.get ('/config',   settingsController.getFullConfig);
router.post('/settings', validate(saveSettingsSchema), settingsController.save);

export default router;
