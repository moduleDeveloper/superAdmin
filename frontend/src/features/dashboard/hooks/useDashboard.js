import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchDashboard } from '../services/dashboardService';

export function useDashboard({ range, from, to }) {
  return useApiQuery(['dashboard', range, from ?? '', to ?? ''], () => fetchDashboard({ range, from, to }));
}
