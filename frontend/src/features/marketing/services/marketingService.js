import { apiGet } from '../../../lib/apiClient';

/**
 * GET /marketing
 * range: 'today' | '7d' | '30d' | 'custom' (custom needs from/to as YYYY-MM-DD)
 *
 * Response data:
 * {
 *   totalLeads, leadsToday,
 *   period: { count, from, to },
 *   lastLead: { name, source, receivedAt } | null,
 *   leads: [{ id, receivedAt, source, platform, isOrganic, status, campaign }]   // the selected period, newest first
 * }
 */
export const fetchMarketingOverview = ({ range, from, to }) => apiGet('/marketing', { range, from, to });
