import { useEffect, useState } from 'react';

/**
 * useState that survives leaving the page and coming back (kept in sessionStorage for this browser tab), so a table
 * returns with the same period, search, sort and page. Storage can be unavailable; it then behaves like useState.
 */
export function useSessionState(storageKey, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved === null ? initial : JSON.parse(saved);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // not saved; the state still works for this visit
    }
  }, [storageKey, value]);

  return [value, setValue];
}
