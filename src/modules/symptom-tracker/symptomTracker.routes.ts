import { Router } from 'express';
import { symptomTrackerController as ctrl } from './symptomTracker.controller';
import { authenticate, requireAdmin } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  createTrackerConfigSchema,
  updateTrackerConfigSchema,
  typeParamSchema,
  submitTrackerSchema,
  historyQuerySchema,
  submissionIdParamSchema,
} from './symptomTracker.validation';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — no auth required
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/symptom-tracker/configs */
router.get('/configs', ctrl.listConfigs);

/** GET /api/symptom-tracker/configs/:type */
router.get('/configs/:type', validate(typeParamSchema), ctrl.getConfigByType);

// ─────────────────────────────────────────────────────────────────────────────
// USER — authenticated
// ─────────────────────────────────────────────────────────────────────────────

router.use(authenticate);

/** POST /api/symptom-tracker/submit */
router.post('/submit', validate(submitTrackerSchema), ctrl.submit);

/** GET /api/symptom-tracker/history */
router.get('/history', validate(historyQuerySchema), ctrl.getHistory);

/** GET /api/symptom-tracker/history/:id */
router.get('/history/:id', validate(submissionIdParamSchema), ctrl.getSubmissionById);

/** GET /api/symptom-tracker/trend?trackerType=anxiety */
router.get('/trend', ctrl.getTrend);

/** GET /api/symptom-tracker/latest */
router.get('/latest', ctrl.getLatest);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — authenticated + admin role
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireAdmin);

/** GET /api/symptom-tracker/admin/configs */
router.get('/admin/configs', ctrl.listConfigsAdmin);

/** POST /api/symptom-tracker/admin/configs */
router.post('/admin/configs', validate(createTrackerConfigSchema), ctrl.createConfig);

/** PATCH /api/symptom-tracker/admin/configs/:type */
router.patch('/admin/configs/:type', validate(updateTrackerConfigSchema), ctrl.updateConfig);

/** DELETE /api/symptom-tracker/admin/configs/:type */
router.delete('/admin/configs/:type', validate(typeParamSchema), ctrl.deleteConfig);

/** GET /api/symptom-tracker/admin/submissions */
router.get('/admin/submissions', ctrl.adminListSubmissions);

/** GET /api/symptom-tracker/admin/stats */
router.get('/admin/stats', ctrl.adminStats);

export default router;
