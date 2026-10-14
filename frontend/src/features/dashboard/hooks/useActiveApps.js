import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchActiveApps } from '../services/dashboardService';

/**
 * The busiest apps for one ad source (or 'direct': no ad lead), ranked within that group. Only asked for when a choice
 * other than 'all' is made: the default list already comes with the dashboard. Each choice is cached.
 */
export function useActiveApps({ range, from, to }, scope) {
  return useApiQuery(['dashboard-active-apps', scope, range, from ?? '', to ?? ''], () => fetchActiveApps({ range, from, to, scope }), {
    enabled: scope !== 'all',
  });
}
