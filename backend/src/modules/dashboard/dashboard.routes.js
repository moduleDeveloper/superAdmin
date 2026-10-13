import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { fetchDashboard } from './dashboard.controller.js';

const router = Router();

router.get('/', requireAuth, fetchDashboard);

export default router;
