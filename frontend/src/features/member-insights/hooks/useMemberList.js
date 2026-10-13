import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchMembers } from '../services/memberInsightsService';

/**
 * Loads one page of members. The previous page stays on screen while the next one loads, and a page seen
 * before comes back from the cache straight away.
 */
export function useMemberList(params) {
  const { page, pageSize, sortBy, sort, search, trust, appDownload, columns, range, from, to } = params;
  const key = ['member-list', page, pageSize, sortBy, sort, search, trust, appDownload, columns, range, from ?? '', to ?? ''];

  return useApiQuery(key, () => fetchMembers({ page, pageSize, sortBy, sort, search, trust, appDownload, columns, range, from, to }), {
    keepPrevious: true,
  });
}
