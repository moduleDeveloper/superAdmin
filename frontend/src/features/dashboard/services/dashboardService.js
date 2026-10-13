import { apiGet } from '../../../lib/apiClient';

/**
 * GET /dashboard
 * range: 'today' | '7d' | '30d' | 'custom' (custom needs from/to as YYYY-MM-DD)
 *
 * Response data:
 * {
 *   period: { from, to },
 *   totals: { members, membersInPeriod, membersToday, appDownloaded, trusts, trustsInPeriod, trustsToday,
 *             leads, leadsInPeriod, leadsToday },
 *   activity: { total, byUsers, byMembers },                 // page_activity rows in the period
 *   series: { members | trusts | activity | leads: { trend: [{ date, count }], byHour: [{ hour, count }] } },
 *   topTrusts: [{ id, name, count }],                        // busiest apps in the period
 *   leadChannels: [{ label, count }],                        // leads received in the period, by source
 *   leadConversion: { leads, withMobile, converted }         // converted = joined as a member after the lead came in
 * }
 */
export const fetchDashboard = ({ range, from, to }) => apiGet('/dashboard', { range, from, to });
