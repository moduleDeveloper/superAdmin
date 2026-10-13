import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberApps } from '../services/memberInsightsService';

/** Loads every app one member created. The previous period stays on screen while a new one loads. */
export function useMemberApps(memberId, { range, from, to }) {
  return useApiQuery(['member-apps', memberId, range, from ?? '', to ?? ''], () => fetchMemberApps(memberId, { range, from, to }), {
    keepPrevious: true,
  });
}
