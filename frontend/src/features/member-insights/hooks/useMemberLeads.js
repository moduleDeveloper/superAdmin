import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberLeads } from '../services/memberInsightsService';

/** Leads received in the selected period and how many became members, for the "Leads in this period" cards. */
export function useMemberLeads({ range, from, to }) {
  return useApiQuery(['member-leads', range, from ?? '', to ?? ''], () => fetchMemberLeads({ range, from, to }));
}
