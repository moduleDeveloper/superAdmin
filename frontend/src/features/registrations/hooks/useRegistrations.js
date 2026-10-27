import { useApiQuery } from '../../../hooks/useApiQuery';
import { fetchRegistrations, fetchRegistrationSummary, fetchRegistrationTimeline } from '../services/registrationsService';

/** One page of the people who registered in the period. The previous page stays on screen while the next one loads. */
export function useRegistrations({ range, from, to }, { search, page, pageSize }) {
  return useApiQuery(['registrations', range, from ?? '', to ?? '', search, page, pageSize], () => fetchRegistrations({ range, from, to, search, page, pageSize }), {
    keepPrevious: true,
  });
}

/** The cards above the list: registrations, leads, logged in, apps created. */
export function useRegistrationSummary({ range, from, to }) {
  return useApiQuery(['registration-summary', range, from ?? '', to ?? ''], () => fetchRegistrationSummary({ range, from, to }), { keepPrevious: true });
}

/** Everything one registered member did. */
export function useRegistrationTimeline(memberId) {
  return useApiQuery(['registration-timeline', memberId], () => fetchRegistrationTimeline(memberId));
}
