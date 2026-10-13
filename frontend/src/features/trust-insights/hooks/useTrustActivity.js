import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchTrustActivity } from '../services/trustInsightsService';

export function useTrustActivity(trustId, { range, from, to, user, target }) {
  return useApiQuery(['trust-activity', trustId, range, from ?? '', to ?? '', user ?? '', target ?? ''], () =>
    fetchTrustActivity(trustId, { range, from, to, user, target })
  );
}
