const FRESH_MS = 5 * 60 * 1000; // served as is
const STALE_MS = 30 * 60 * 1000; // served at once, and refreshed in the background
const MAX_ENTRIES = 200;

const entries = new Map(); // key -> { value, at }
const pending = new Map(); // key -> promise of a load already running

function load(key, loader) {
    if (!pending.has(key)) {
        const promise = loader()
            .then((value) => {
                entries.set(key, { value, at: Date.now() });
                if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
                return value;
            })
            .finally(() => pending.delete(key));
        pending.set(key, promise);
    }
    return pending.get(key);
}

/**
 * Cached result of `loader()` for `key`. Younger than FRESH_MS: returned straight away. Older (up to STALE_MS): the old
 * result is returned straight away and a refresh runs in the background. Otherwise it waits for a fresh load.
 * Requests for the same key that arrive while it is loading share that one load.
 */
export async function cached(key, loader) {
    const hit = entries.get(key);
    const age = hit ? Date.now() - hit.at : Infinity;

    if (age < FRESH_MS) return hit.value;
    if (age < STALE_MS) {
        load(key, loader).catch((error) => console.error(`refresh of ${key} failed:`, error.message));
        return hit.value;
    }
    return load(key, loader);
}

/** Loads `key` again now (sharing a load already running) and replaces the cached result. */
export const refresh = (key, loader) => load(key, loader);
