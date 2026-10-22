import { QueryClient } from '@tanstack/react-query';

/**
 * One cache for every API read. A result younger than STALE_MS is shown as is; an older one is shown straight
 * away and refreshed in the background, so going back to a table is instant instead of a new wait.
 */
export const STALE_MS = 5 * 60 * 1000;
const KEEP_MS = 30 * 60 * 1000; // how long an unused result stays in memory

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_MS,
      gcTime: KEEP_MS,
      retry: false, // apiGet already turns failures into readable messages, and a 401 logs out
      refetchOnWindowFocus: false,
    },
  },
});
