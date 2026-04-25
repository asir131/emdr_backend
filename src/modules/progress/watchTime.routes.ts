import { Router } from 'express';
import { watchTimeController as ctrl } from './watchTime.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Log heartbeat (seconds spent)
router.post('/log', ctrl.logTime);

// Get weekly watch time history
router.get('/weekly-stats', ctrl.getWeeklyReport);

// Get total time spent on a specific journey
router.get('/journey/:journeyId', ctrl.getJourneyStats);

export default router;
