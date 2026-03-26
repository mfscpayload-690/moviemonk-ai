import { useMemo } from 'react';
import Fuse, { FuseOptionKey } from 'fuse.js';

export interface SearchableMovieItem {
  title: string;
  year?: string;
  genres?: string[];
  overview?: string;
  cast?: string[];
}

export interface UseMovieSearchOptions<T extends SearchableMovieItem> {
  limit?: number;
  threshold?: number;
  keys?: FuseOptionKey<T>[];
}

const DEFAULT_LIMIT = 20;
const DEFAULT_THRESHOLD = 0.34;

export function useMovieSearch<T extends SearchableMovieItem>(
  items: T[],
  query: string,
  options: UseMovieSearchOptions<T> = {}
): T[] {
  const { limit = DEFAULT_LIMIT, threshold = DEFAULT_THRESHOLD, keys } = options;

  const fuse = useMemo(() => {
    return new Fuse(items, {
      includeScore: true,
      threshold,
      shouldSort: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: keys || [
        { name: 'title', weight: 0.65 },
        { name: 'genres', weight: 0.15 },
        { name: 'overview', weight: 0.1 },
        { name: 'cast', weight: 0.1 }
      ]
    });
  }, [items, keys, threshold]);

  return useMemo(() => {
    const normalized = query.trim();
    if (!normalized) {
      return items.slice(0, limit);
    }

    return fuse.search(normalized, { limit }).map((result) => result.item);
  }, [fuse, items, limit, query]);
}
