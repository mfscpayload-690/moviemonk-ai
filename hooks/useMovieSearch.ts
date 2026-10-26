import { useMemo } from 'react';

export interface SearchableMovieItem {
  title: string;
  year?: string;
  genres?: string[];
  overview?: string;
  cast?: string[];
}

export interface UseMovieSearchOptions {
  limit?: number;
}

const DEFAULT_LIMIT = 20;

export function useMovieSearch<T extends SearchableMovieItem>(
  items: T[],
  query: string,
  options: UseMovieSearchOptions = {}
): T[] {
  const { limit = DEFAULT_LIMIT } = options;

  return useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, limit);
    }
    const terms = normalized.split(/\s+/).filter(Boolean);

    return items
      .map((item) => {
        const title = (item.title || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        const genres = (item.genres || []).join(' ').toLowerCase();
        const cast = (item.cast || []).join(' ').toLowerCase();

        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += 10;
          if (genres.includes(term)) score += 3;
          if (cast.includes(term)) score += 2;
          if (overview.includes(term)) score += 1;
        }
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item);
  }, [items, limit, query]);
}
