import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchTrustMemberLogins } from '../services/trustInsightsService';

export function useTrustMemberLogins(trustId) {
  return useApiQuery(['trust-member-logins', trustId], () => fetchTrustMemberLogins(trustId));
}
