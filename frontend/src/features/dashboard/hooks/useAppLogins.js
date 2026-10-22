import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchAppLogins } from '../services/dashboardService';

/** One page of an app's login sessions. The previous page stays on screen while the next one loads. */
export function useAppLogins(trustId, { range, from, to }, { search, page, pageSize }) {
  return useApiQuery(
    ['dashboard-app-logins', trustId, range, from ?? '', to ?? '', search, page, pageSize],
    () => fetchAppLogins({ trustId, range, from, to, search, page, pageSize }),
    { keepPrevious: true, enabled: Boolean(trustId) }
  );
}
