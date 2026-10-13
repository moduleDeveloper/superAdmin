import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchTrustInsights } from '../services/trustInsightsService';

export function useTrustInsights({ range, from, to }) {
  return useApiQuery(['trust-insights', range, from ?? '', to ?? ''], () => fetchTrustInsights({ range, from, to }));
}
