import { resolveRange } from '../../utils/dateRange.js';
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
