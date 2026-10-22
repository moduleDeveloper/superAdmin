import { useCallback, useState } from 'react';

const STORAGE_KEY = 'theme';

/** Light (Clean Light) is the normal mode; dark is Midnight Gold. index.html applies the saved choice before first paint. */
export function useTheme() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'));

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not saved; the theme still switches for this visit
    }
    setTheme(next);
  }, [theme]);

  return [theme, toggle];
}
