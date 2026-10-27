import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware.js';
import { fetchActiveApps, fetchAppJourney, fetchAppLogins, fetchCampaignLeads, fetchDashboard, fetchNewApps, fetchOtpNotLogin } from './dashboard.controller.js';

const router = Router();

router.get('/', requireAuth, fetchDashboard);
router.get('/campaign-leads', requireAuth, fetchCampaignLeads);
router.get('/active-apps', requireAuth, fetchActiveApps);
router.get('/app-journey', requireAuth, fetchAppJourney);
router.get('/app-logins', requireAuth, fetchAppLogins);
router.get('/otp-not-login', requireAuth, fetchOtpNotLogin);
router.get('/new-apps', requireAuth, fetchNewApps);

export default router;
