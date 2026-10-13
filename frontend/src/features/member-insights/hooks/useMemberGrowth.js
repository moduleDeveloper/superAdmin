import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberGrowth } from '../services/memberInsightsService';

/** Members joined over the selected period, for the graph. `loadedAt` lets the graph stop at the current hour. */
export function useMemberGrowth({ range, from, to }) {
  return useApiQuery(['member-growth', range, from ?? '', to ?? ''], () => fetchMemberGrowth({ range, from, to }));
}
