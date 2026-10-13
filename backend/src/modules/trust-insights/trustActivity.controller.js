import { resolveRange } from '../../utils/dateRange.js';
import { getTrustActivity, getTrustMemberActions } from './trustActivity.service.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Builds the handler for one kind of trust activity (registered users, or members using the app). */
function activityHandler(load, failureMessage) {
    return async (req, res) => {
        try {
            const { trustId } = req.params;
            const { range, from, to, user, target } = req.query;

            if (!UUID_PATTERN.test(trustId)) {
                return res.status(400).json({ success: false, message: 'Invalid trust id' });
            }

            const resolved = resolveRange({ range, from, to });
            if (resolved.error) {
                return res.status(400).json({ success: false, message: resolved.error });
            }

            const data = await load(trustId, resolved, { user, target });
            if (!data) {
                return res.status(404).json({ success: false, message: 'Trust not found' });
            }

            return res.json({ success: true, data });
        } catch (error) {
            console.error(`${failureMessage}:`, error);
            return res.status(500).json({ success: false, message: failureMessage });
        }
    };
}

export const fetchTrustActivity = activityHandler(getTrustActivity, 'Failed to load trust activity');
export const fetchTrustMemberActions = activityHandler(getTrustMemberActions, 'Failed to load member actions');
