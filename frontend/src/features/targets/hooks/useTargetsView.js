import { useSyncExternalStore } from 'react';

/**
 * What the Targets page is showing: the period, and the platform / colour filters. The top bar menu and the page both
 * read and change it, so choosing "Meta" in the menu filters the page. Kept for this browser tab (sessionStorage).
 */
const STORAGE_KEY = 'setu:targets:view';
const DEFAULT_VIEW = { period: '7d', platform: null, status: null };

const listeners = new Set();
let lastRaw;
let lastValue = DEFAULT_VIEW;

function getSnapshot() {
  let raw = null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // storage unavailable: the view lives only in memory
  }
  if (raw !== lastRaw && raw !== null) {
    lastRaw = raw;
    try {
      lastValue = { ...DEFAULT_VIEW, ...JSON.parse(raw) };
    } catch {
      lastValue = DEFAULT_VIEW;
    }
  }
  return lastValue;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(patch) {
  lastValue = { ...getSnapshot(), ...patch };
  lastRaw = JSON.stringify(lastValue);
  try {
    sessionStorage.setItem(STORAGE_KEY, lastRaw);
  } catch {
    // kept in memory
  }
  listeners.forEach((listener) => listener());
}

/** [view, setView(patch)]: view = { period, platform, status }. */
export function useTargetsView() {
  return [useSyncExternalStore(subscribe, getSnapshot), update];
}
