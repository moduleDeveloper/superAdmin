import { cached } from '../../utils/cache.js';
import { resolveRange } from '../../utils/dateRange.js';
import { APP_SCOPES, getMostActiveApps } from './activeApps.service.js';
import { getAppJourney } from './appJourney.service.js';
import { getAppLogins } from './appLogins.service.js';
import { getDashboard } from './dashboard.service.js';
import { getNewApps } from './newApps.service.js';
import { getOtpNotLoginReport } from './otpNotLoginReport.service.js';
import { getCampaignLeads } from '../marketing/leadStats.service.js';

export async function fetchDashboard(req, res) {
    try {
        const range = resolveRange(req.query);

        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const data = await cached(`dashboard:${JSON.stringify(range)}`, () => getDashboard(range));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchDashboard failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
    }
}

/** One page of the leads behind a campaign row (optionally narrowed to a platform / ad set, or searched). */
export async function fetchCampaignLeads(req, res) {
    try {
        const { campaign, source, platform, adSet, search } = req.query;
        const stage = ['loggedIn', 'notLoggedIn', 'app', 'noApp', 'active'].includes(req.query.stage) ? req.query.stage : undefined;
        if (!campaign) {
            return res.status(400).json({ success: false, message: 'campaign is required' });
        }

        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1,Number.parseInt(req.query.pageSize, 10) || 10));

        const sort = req.query.sort === 'asc' ? 'asc' : 'desc';

        const params = { campaign, source, platform, adSet, search, page, pageSize, sort, stage };
        const data = await cached(`campaign-leads:${JSON.stringify(range)}:${JSON.stringify(params)}`, () => getCampaignLeads(range, params));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchCampaignLeads failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load leads' });
    }
}

/** The busiest apps for one ad source (or the apps that came without an ad lead), for the Most Active Apps dropdown. */
export async function fetchActiveApps(req, res) {
    try {
        const { scope = 'all' } = req.query;
        if (!APP_SCOPES.includes(scope)) {
            return res.status(400).json({ success: false, message: 'Unknown scope' });
        }

        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const data = await cached(`active-apps:${scope}:${JSON.stringify(range)}`, () => getMostActiveApps(range, scope));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchActiveApps failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load active apps' });
    }
}

/** The detail behind one app's journey card: where its users spend time, latest activity, app link. */
export async function fetchAppJourney(req, res) {
    try {
        const { trustId } = req.query;
        if (!trustId) {
            return res.status(400).json({ success: false, message: 'trustId is required' });
        }

        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const data = await cached(`app-journey:${trustId}:${JSON.stringify(range)}`, () => getAppJourney(trustId, range));
        if (!data) return res.status(404).json({ success: false, message: 'App not found' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchAppJourney failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load app journey' });
    }
}

/** The login sessions behind an app's "App Logins" number, one page at a time. */
export async function fetchAppLogins(req, res) {
    try {
        const { trustId, search } = req.query;
        if (!trustId) {
            return res.status(400).json({ success: false, message: 'trustId is required' });
        }

        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));

        const data = await cached(`app-logins:${trustId}:${JSON.stringify(range)}:${search ?? ''}:${page}:${pageSize}`, () => getAppLogins(trustId, range, { search, page, pageSize }));
        if (!data) return res.status(404).json({ success: false, message: 'App not found' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchAppLogins failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load app logins' });
    }
}

/** The people behind the "OTP Not Login" number: how many per source and campaign, and who they are (one page at a time). */
/** { key, dir } from ?sort=key&dir=asc|desc (the key is checked by the service). */
const sortOf = ({ sort, dir }) => ({ key: typeof sort === 'string' ? sort : '', dir: dir === 'asc' ? 'asc' : 'desc' });

export async function fetchOtpNotLogin(req, res) {
    try {
        const { source, campaign, search } = req.query;
        const status = ['notLoggedIn', 'loggedIn'].includes(req.query.status) ? req.query.status : 'all';
        const sort = sortOf(req.query);
        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));

        const params = { source, campaign, search, status, sort, page, pageSize };
        const data = await cached(`otp-not-login:${JSON.stringify(range)}:${JSON.stringify(params)}`, () => getOtpNotLoginReport(range, params));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchOtpNotLogin failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load OTP not login members' });
    }
}

/** The apps created in the period and who built them: one page, searchable, sortable, narrowed by where the owner came from. */
export async function fetchNewApps(req, res) {
    try {
        const { source, search } = req.query;
        const sort = sortOf(req.query);
        const range = resolveRange(req.query);
        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));

        const params = { source, search, sort, page, pageSize };
        const data = await cached(`new-apps:${JSON.stringify(range)}:${JSON.stringify(params)}`, () => getNewApps(range, params));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchNewApps failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load new apps' });
    }
}
