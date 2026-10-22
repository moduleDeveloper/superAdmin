import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchAppJourney } from '../services/dashboardService';

/** The detail behind one app's journey card (modules, recent activity, app link), asked for when the card is opened. */
export function useAppJourney(trustId, { range, from, to }) {
  return useApiQuery(['dashboard-app-journey', trustId, range, from ?? '', to ?? ''], () => fetchAppJourney({ trustId, range, from, to }));
}
