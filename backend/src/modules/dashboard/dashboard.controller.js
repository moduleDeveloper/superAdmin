import { resolveRange } from '../../utils/dateRange.js';
import { APP_SCOPES, getMostActiveApps } from './activeApps.service.js';
import { getDashboard } from './dashboard.service.js';

export async function fetchDashboard(req, res) {
    try {
        const range = resolveRange(req.query);

        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const data = await getDashboard(range);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchDashboard failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load dashboard' });
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

        const data = await getMostActiveApps(range, scope);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchActiveApps failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load active apps' });
    }
}
