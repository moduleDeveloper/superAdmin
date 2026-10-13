import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMemberActivity } from '../services/memberInsightsService';

export function useMemberActivity(memberId, { trust, range, from, to, target }) {
  return useApiQuery(['member-activity', memberId, trust ?? '', range, from ?? '', to ?? '', target ?? ''], () =>
    fetchMemberActivity(memberId, { trust, range, from, to, target })
  );
}
