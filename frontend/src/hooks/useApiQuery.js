import { keepPreviousData, useQuery } from '@tanstack/react-query';

/**
 * Cached GET for the insight pages (see lib/queryClient.js).
 *
 * `key` is everything the request depends on; the same key reuses the cached result. With `keepPrevious`, the
 * last result stays on screen while a new key loads (used by tables, so they do not blank out while paging).
 *
 * `enabled: false` holds the request back until it is wanted (loading stays true, so callers use it only when enabled).
 *
 * Returns { data, loadedAt, error, loading }: `loading` is true only while there is nothing for this key to show
 * (or the previous key's data is being shown); a background refresh of cached data is not "loading".
 */
export function useApiQuery(key, fetcher, { keepPrevious = false, staleTime, enabled = true } = {}) {
  const query = useQuery({
    queryKey: key,
    queryFn: fetcher,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    staleTime,
    enabled,
  });

  return {
    data: query.data ?? null,
    loadedAt: query.dataUpdatedAt || null, // when `data` arrived; lets graphs stop at the current hour
    error: query.error?.message ?? '',
    loading: query.isPending || query.isPlaceholderData,
  };
}
