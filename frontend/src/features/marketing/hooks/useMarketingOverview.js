import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMarketingOverview } from '../services/marketingService';

export function useMarketingOverview({ range, from, to }) {
  return useApiQuery(['marketing', range, from ?? '', to ?? ''], () => fetchMarketingOverview({ range, from, to }));
}
