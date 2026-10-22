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
 *   activeApps: { scopeCounts: { all, meta, whatsapp, google, website, organic, direct }, apps: [{ id, name, owner, ownerMobile, createdAt, appActions, userPanel, score, logins, lastActiveAt,
 *                 firstLogin: { at, platform, method, city, state } | null,
 *                 cameFrom: { source, platform, campaign, adSet, receivedAt } | null }] }   // top 10 in the period, busiest first
 *   campaigns: [{ label, channels, leads, members, loggedIn, creators, apps, activeCreators, activeApps,
 *                platforms: [row], adSets: [row] }]       // per campaign; leads with no campaign are grouped by source
 * }
 */
export const fetchDashboard = ({ range, from, to }) => apiGet('/dashboard', { range, from, to });

/**
 * GET /dashboard/active-apps?scope=…  (same range params)
 * scope: 'all' | 'meta' | 'whatsapp' | 'google' | 'website' | 'organic' | 'direct' (owner came without an ad lead).
 * The top 10 apps ranked within that group. Response data: { apps: [same rows as dashboard.activeApps.apps],
 * scopeCounts: { all, meta, whatsapp, google, website, organic, direct } }  // apps with activity in the period, per group
 */
export const fetchActiveApps = ({ range, from, to, scope }) => apiGet('/dashboard/active-apps', { range, from, to, scope });

/**
 * GET /dashboard/campaign-leads  (same range params)
 * One page of the leads behind a campaign row, newest first. campaign is required; source ('meta' | 'whatsapp' | 'google' | 'website' |
 * 'organic'), platform, adSet and search (name or mobile number) narrow it. stage ('loggedIn' | 'app') keeps only the people counted in that
 * column of the campaign table and adds summary { people, apps } to the response. sort ('asc' | 'desc') orders by the time the lead was received, newest first by default; pageSize is at most 100.
 * Response data: { total, page, pageSize, leads: [{ id, name, mobile, channel, adSet, receivedAt,
 *                  stage: 'lead' | 'member' | 'loggedIn' | 'app' | 'active' }] }
 */
export const fetchCampaignLeads = ({ range, from, to, campaign, source, platform, adSet, stage, search, page, pageSize, sort }) =>
  apiGet('/dashboard/campaign-leads', { range, from, to, campaign, source, platform, adSet, stage, search, page, pageSize, sort });

/**
 * GET /dashboard/app-journey?trustId=…  (same range params)
 * The detail behind one app's journey card. Response data: { appLink, appSlug, ownerMobile, joinedAt, downloaded, ownerSource,
 * modules: [{ label, count }] (where its users spend time), recent: [{ at, title, detail, kind, panel }], activityCount }
 */
export const fetchAppJourney = ({ trustId, range, from, to }) => apiGet('/dashboard/app-journey', { trustId, range, from, to });

/**
 * GET /dashboard/app-logins?trustId=…  (same range params, plus search, page, pageSize)
 * The login sessions behind an app's "App Logins" number, newest first. Response data: { trust: { id, name }, total, uniqueMembers,
 * page, pageSize, logins: [{ id, memberId, name, mobile, platform, method, city, state, device, at }] }
 */
export const fetchAppLogins = ({ trustId, range, from, to, search, page, pageSize }) =>
  apiGet('/dashboard/app-logins', { trustId, range, from, to, search, page, pageSize });
