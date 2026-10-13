import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchTrustMemberActions } from '../services/trustInsightsService';

export function useTrustMemberActions(trustId, { range, from, to, user, target }) {
  return useApiQuery(['trust-member-actions', trustId, range, from ?? '', to ?? '', user ?? '', target ?? ''], () =>
    fetchTrustMemberActions(trustId, { range, from, to, user, target })
  );
}
