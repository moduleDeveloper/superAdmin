import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberTrusts } from '../services/memberInsightsService';

/** Loads every trust one member belongs to. */
export function useMemberTrusts(memberId) {
  return useApiQuery(['member-trusts', memberId], () => fetchMemberTrusts(memberId));
}
