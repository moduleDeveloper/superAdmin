import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { fetchRegistrations, fetchRegistrationSummary, fetchRegistrationTimeline } from './registrations.controller.js';

const router = Router();

router.get('/', requireAuth, fetchRegistrations);
router.get('/summary', requireAuth, fetchRegistrationSummary);
router.get('/:memberId/timeline', requireAuth, fetchRegistrationTimeline);

export default router;
