import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberSummary, fetchTrustOptions } from '../services/memberInsightsService';

/** Loads the summary cards and the trust dropdown options. `ready` once both have answered (or failed). */
export function useMemberSummary() {
  const summary = useApiQuery(['member-summary'], fetchMemberSummary);
  const trusts = useApiQuery(['trust-options'], fetchTrustOptions);

  return {
    summary: summary.data,
    trusts: trusts.data ?? [],
    error: summary.error || trusts.error,
    ready: !summary.loading && !trusts.loading,
  };
}
