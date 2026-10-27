import { cached } from '../../utils/cache.js';
import { resolveRange } from '../../utils/dateRange.js';
import { getRegistrations, getRegistrationSummary, getRegistrationTimeline } from './registrations.service.js';

/** The cards above the list: registrations, leads, logged in, apps created, for the selected period. */
export async function fetchRegistrationSummary(req, res) {
    try {
        const range = resolveRange(req.query);
        if (range.error) return res.status(400).json({ success: false, message: range.error });

        const data = await cached(`registration-summary:${JSON.stringify(range)}`, () => getRegistrationSummary(range));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchRegistrationSummary failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load registration summary' });
    }
}

/** The people who registered in the selected period, one page at a time. */
export async function fetchRegistrations(req, res) {
    try {
        const range = resolveRange(req.query);
        if (range.error) return res.status(400).json({ success: false, message: range.error });

        const search = typeof req.query.search === 'string' ? req.query.search : '';
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));

        const data = await cached(`registrations:${JSON.stringify(range)}:${search}:${page}:${pageSize}`, () => getRegistrations(range, { search, page, pageSize }));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchRegistrations failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load registrations' });
    }
}

/** Everything one registered member did: login, app created, apps and pages opened. */
export async function fetchRegistrationTimeline(req, res) {
    try {
        const { memberId } = req.params;
        const data = await cached(`registration-timeline:${memberId}`, () => getRegistrationTimeline(memberId));
        if (!data) return res.status(404).json({ success: false, message: 'Member not found' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchRegistrationTimeline failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load member activity' });
    }
}
