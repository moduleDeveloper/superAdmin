import { cached } from '../../utils/cache.js';
import { resolveRange } from '../../utils/dateRange.js';
import { APP_SCOPES, getMostActiveApps } from './activeApps.service.js';
import { getAppJourney } from './appJourney.service.js';
import { getAppLogins } from './appLogins.service.js';
import { getDashboard } from './dashboard.service.js';
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
        const stage = ['loggedIn', 'app'].includes(req.query.stage) ? req.query.stage : undefined;
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
