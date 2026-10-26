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

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function editDistanceWithin(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length] <= max;
}

export function searchMovieItems<T extends SearchableMovieItem>(
  items: T[],
  query: string,
  options: UseMovieSearchOptions = {}
): T[] {
  const { limit = DEFAULT_LIMIT } = options;
  const normalized = normalizeText(query.trim());
  if (!normalized) {
    return items.slice(0, limit);
  }
  const terms = normalized.split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      const title = normalizeText(item.title || '');
      const overview = normalizeText(item.overview || '');
      const genres = normalizeText((item.genres || []).join(' '));
      const cast = normalizeText((item.cast || []).join(' '));

      let score = 0;
      for (const term of terms) {
        const maxTypos = term.length >= 5 ? 1 : 0;
        const titleMatches =
          title.includes(term) ||
          (maxTypos > 0 &&
            title
              .split(/[\s\p{P}]+/u)
              .filter(Boolean)
              .some((word) => editDistanceWithin(term, word, maxTypos)));
        if (titleMatches) score += 10;
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
}

export function useMovieSearch<T extends SearchableMovieItem>(
  items: T[],
  query: string,
  options: UseMovieSearchOptions = {}
): T[] {
  const limit = options.limit;
  return useMemo(() => searchMovieItems(items, query, { limit }), [items, query, limit]);
}
