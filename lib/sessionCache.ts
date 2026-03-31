/**
 * Session-level cache for movie & person data.
 *
 * Uses sessionStorage so cache is naturally scoped to the browser tab and
 * cleared when the tab closes — no stale data across sessions.
 *
 * TTL: 30 minutes. Entries older than that are treated as misses and evicted.
 */

const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  ts: number; // Date.now() when cached
}

function storageKey(namespace: string, id: string): string {
  return `mm_cache:${namespace}:${id}`;
}

/** Write a value to sessionStorage cache. Silently ignores QuotaExceededError. */
export function cacheSet<T>(namespace: string, id: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    sessionStorage.setItem(storageKey(namespace, id), JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — skip silently
  }
}

/** Read a value from sessionStorage cache. Returns null on miss or expiry. */
export function cacheGet<T>(namespace: string, id: string): T | null {
  try {
    const raw = sessionStorage.getItem(storageKey(namespace, id));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > TTL_MS) {
      sessionStorage.removeItem(storageKey(namespace, id));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/** Remove a single entry from the cache (e.g. after a mutation). */
export function cacheInvalidate(namespace: string, id: string): void {
  try {
    sessionStorage.removeItem(storageKey(namespace, id));
  } catch { /* noop */ }
}

/** Convenience: build a cache key for a movie lookup. */
export function movieCacheKey(tmdbId: string | number, tvShow: boolean): string {
  return `${tmdbId}:${tvShow ? 'tv' : 'movie'}`;
}

/** Convenience: build a cache key for a person lookup. */
export function personCacheKey(personId: string | number): string {
  return String(personId);
}
