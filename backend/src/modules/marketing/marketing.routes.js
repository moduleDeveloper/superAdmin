import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { fetchLeadsOverview } from './marketing.controller.js';

const router = Router();

router.get('/', requireAuth, fetchLeadsOverview);

export default router;
