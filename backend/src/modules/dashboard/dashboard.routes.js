import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { fetchActiveApps, fetchDashboard } from './dashboard.controller.js';

const router = Router();

router.get('/', requireAuth, fetchDashboard);
router.get('/active-apps', requireAuth, fetchActiveApps);

export default router;
