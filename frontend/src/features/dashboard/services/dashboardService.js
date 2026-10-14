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
 *   funnel: { leads, withMobile, loggedIn, creators, apps, activeCreators, activeApps }  // each stage is a subset of the one before (people)
 *   sources: [{ key, label, platforms, leads, loggedIn, creators, apps, activeCreators, activeApps, actions, rank | null,
 *               sections: { funnel, campaigns, leadChannels, leadConversion } }]   // ad source cards; sections = the same four for that source
 *   activeApps: { scopeCounts: { all, meta, google, website, other, direct }, apps: [{ id, name, owner, ownerMobile, createdAt, appActions, userPanel, score, logins, lastActiveAt,
 *                 firstLogin: { at, platform, method, city, state } | null,
 *                 cameFrom: { source, platform, campaign, adSet, receivedAt } | null }] }   // top 10 in the period, busiest first
 *   campaigns: [{ label, channels, leads, members, loggedIn, creators, apps, activeCreators, activeApps,
 *                platforms: [row], adSets: [row] }]       // per campaign; leads with no campaign are grouped by source
 * }
 */
export const fetchDashboard = ({ range, from, to }) => apiGet('/dashboard', { range, from, to });

/**
 * GET /dashboard/active-apps?scope=…  (same range params)
 * scope: 'all' | 'meta' | 'google' | 'website' | 'other' | 'direct' (owner came without an ad lead).
 * The top 10 apps ranked within that group. Response data: { apps: [same rows as dashboard.activeApps.apps],
 * scopeCounts: { all, meta, google, website, other, direct } }  // apps with activity in the period, per group
 */
export const fetchActiveApps = ({ range, from, to, scope }) => apiGet('/dashboard/active-apps', { range, from, to, scope });
