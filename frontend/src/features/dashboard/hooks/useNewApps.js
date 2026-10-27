import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchNewApps } from '../services/dashboardService';

/** The apps created in the period and who built them, one sorted page at a time. */
export function useNewApps({ range, from, to }, { source, search, sort, page, pageSize }) {
  return useApiQuery(
    ['dashboard-new-apps', range, from ?? '', to ?? '', source ?? '', search, sort.key, sort.dir, page, pageSize],
    () => fetchNewApps({ range, from, to, source, search, sort: sort.key, dir: sort.dir, page, pageSize }),
    { keepPrevious: true }
  );
}
