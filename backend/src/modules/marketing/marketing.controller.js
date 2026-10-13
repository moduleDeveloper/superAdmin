import { resolveRange } from '../../utils/dateRange.js';
import { getLeadsOverview } from './marketing.service.js';

export async function fetchLeadsOverview(req, res) {
    try {
        const range = resolveRange(req.query);

        if (range.error) {
            return res.status(400).json({ success: false, message: range.error });
        }

        const data = await getLeadsOverview(range);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('fetchLeadsOverview failed:', error);
        return res.status(500).json({ success: false, message: 'Failed to load marketing overview' });
    }
}
