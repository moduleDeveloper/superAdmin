import { apiGet } from '../../../lib/apiClient';

/**
 * GET /member-insights
 * Params: page, pageSize (10|25|50|100), sortBy ('createdAt'|'name'|'mobile'|'email'|'company'|'appDownloaded'|'appCount'|'lastAppCreated'|'actionCount'|'lastAction'|'managerActivity'),
 *         sort ('asc'|'desc'), search, trust (trust id), appDownload ('all'|'yes'|'no'),
 *         range ('today'|'7d'|'30d'|'custom', with from/to as YYYY-MM-DD) = only members who joined in that period,
 *         columns ('all'|'core'): 'core' skips the action columns (actionCount, lastActionAt), which makes the list faster.
 *
 * Response data:
 * {
 *   total, page, pageSize,
 *   members: [{ id, name, mobile, email, companyName, trustCount (active registrations),
 *               managerActivity (page activity in the apps the member owns, during the period),
 *               appCount + lastAppCreatedAt (the trusts owned by the member's superuser),
 *               actionCount + lastActionAt (page_activity rows of the member, all time),
 *               appDownloaded, createdAt }]
 * }
 */
export const fetchMembers = (params) => apiGet('/member-insights', params);

/**
 * GET /member-insights/growth?range=…  (same range params)
 * How many members joined per hour (one day) / day (up to ~2 months) / week, for the graph.
 * Response data: { period: { from, to }, granularity: 'hour'|'day'|'week', counts: [n, …], total,
 * appCreators (+ appCreatorsJoined: those who also joined in the period), appsWithLogins, loggedInMembers (different members who logged in during the period), totalActivity (user activity rows), appsWithActivity, avgActivityPerApp (totalActivity / appsWithActivity, null if none),
 * appsCreated (apps created in the period), totalApps }
 * counts[i] belongs to the bucket starting at period.from + i × (1 hour | 1 day | 7 days).
 */
export const fetchMemberGrowth = ({ range, from, to }) => apiGet('/member-insights/growth', { range, from, to });

/**
 * GET /member-insights/summary  (platform-wide, ignores the table's filters)
 * Response data: { totalMembers, joinedToday, lastJoined: { name, trustName, createdAt } | null }
 */
export const fetchMemberSummary = () => apiGet('/member-insights/summary');

/** GET /member-insights/trusts -> [{ id, name }] for the trust filter dropdown. */
export const fetchTrustOptions = () => apiGet('/member-insights/trusts');

/**
 * GET /member-insights/:memberId/trusts
 * Every trust one member is registered in (the reg_members junction table).
 *
 * Response data:
 * {
 *   member: { id, name, mobile, email, companyName, createdAt },
 *   summary: { total, active, inactive },
 *   trusts: [{ registrationId, trustId, name, logoUrl, appType, role, membershipNumber,
 *              joinedDate, isActive, registeredAt, isPrimary, lastActivityAt (latest page visit in that trust, or null) }]
 * }
 */
export const fetchMemberTrusts = (memberId) => apiGet(`/member-insights/${memberId}/trusts`);

/**
 * GET /member-insights/:memberId/activity?trust=<trust id | 'all'>&range=…&target=…
 * One member's page activity for one of their trusts, or all of them. Same shape as the trust activity report, plus
 * { member, trusts: [{ id, name, isActive }] } and each recent row has trustId / trustName.
 */
export const fetchMemberActivity = (memberId, { trust, range, from, to, target }) =>
  apiGet(`/member-insights/${memberId}/activity`, { trust, range, from, to, target });

/**
 * GET /member-insights/:memberId/apps
 * The apps (trusts) this member created: the trusts owned by their superuser.
 * Response data: { member: { id, name, mobile, email, companyName },
 *                  period: { from, to } | null (the range sent; null = all time),
 *                  apps: [{ id, name, logoUrl, legalName, appType, memberCount, activityCount (page activity of all
 *                          users in the period), uniqueLogins (members who ever logged in), isActive, createdAt }] }
 */
export const fetchMemberApps = (memberId, { range, from, to } = {}) =>
  apiGet(`/member-insights/${memberId}/apps`, { range, from, to });
