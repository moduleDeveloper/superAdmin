import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchOtpNotLogin } from '../services/dashboardService';

/** The SETU app members of the period (never logged in / logged in): counts per source / campaign, and one sorted page of the people. */
export function useOtpNotLogin({ range, from, to }, { status, source, campaign, search, sort, page, pageSize }) {
  return useApiQuery(
    ['dashboard-otp-not-login', range, from ?? '', to ?? '', status, source ?? '', campaign ?? '', search, sort.key, sort.dir, page, pageSize],
    () => fetchOtpNotLogin({ range, from, to, status, source, campaign, search, sort: sort.key, dir: sort.dir, page, pageSize }),
    { keepPrevious: true }
  );
}
