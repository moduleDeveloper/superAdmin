import { useEffect, useState } from 'react';

import { fetchMemberApps } from '../services/memberInsightsService';

/** Loads every app one member created. `loading` is derived by comparing which member the result is for. */
export function useMemberApps(memberId, { range, from, to }) {
  const requestKey = [memberId, range, from, to].map((v) => v ?? '').join('|');
  const [result, setResult] = useState({ key: null, data: null, error: '' });

  useEffect(() => {
    let cancelled = false;

    fetchMemberApps(memberId, { range, from, to })
      .then((data) => !cancelled && setResult({ key: requestKey, data, error: '' }))
      .catch((err) => !cancelled && setResult((prev) => ({ ...prev, key: requestKey, error: err.message })));

    return () => {
      cancelled = true;
    };
  }, [memberId, range, from, to, requestKey]);

  const settled = result.key === requestKey;

  return {
    data: result.data, // kept while a new period loads, so the table does not blank out
    error: settled ? result.error : '',
    loading: !settled,
  };
}
