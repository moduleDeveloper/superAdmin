import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import marketingRoutes from '../modules/marketing/marketing.routes.js';
import memberInsightsRoutes from '../modules/member-insights/memberInsights.routes.js';
import trustInsightsRoutes from '../modules/trust-insights/trustInsights.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trust-insights', trustInsightsRoutes);
router.use('/member-insights', memberInsightsRoutes);
router.use('/marketing', marketingRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
