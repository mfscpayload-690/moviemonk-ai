import type { SearchResult } from '../types';

type FeedbackSignal = 'up' | 'down';

export type RankingFeedbackStore = {
  positiveGenres: Record<number, number>;
  negativeGenres: Record<number, number>;
  positiveMediaType: Record<'movie' | 'tv', number>;
  negativeMediaType: Record<'movie' | 'tv', number>;
  helpfulQueries: string[];
  unhelpfulQueries: string[];
  updatedAt: string;
};

const STORAGE_KEY = 'moviemonk_ranking_feedback_v1';

function defaultStore(): RankingFeedbackStore {
  return {
    positiveGenres: {},
    negativeGenres: {},
    positiveMediaType: { movie: 0, tv: 0 },
    negativeMediaType: { movie: 0, tv: 0 },
    helpfulQueries: [],
    unhelpfulQueries: [],
    updatedAt: new Date(0).toISOString()
  };
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function loadStore(): RankingFeedbackStore {
  const storage = getStorage();
  if (!storage) return defaultStore();

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return defaultStore();

  try {
    const parsed = JSON.parse(raw) as Partial<RankingFeedbackStore>;
    return {
      ...defaultStore(),
      ...parsed,
      positiveGenres: { ...(parsed.positiveGenres || {}) },
      negativeGenres: { ...(parsed.negativeGenres || {}) },
      positiveMediaType: {
        movie: Number(parsed.positiveMediaType?.movie || 0),
        tv: Number(parsed.positiveMediaType?.tv || 0)
      },
      negativeMediaType: {
        movie: Number(parsed.negativeMediaType?.movie || 0),
        tv: Number(parsed.negativeMediaType?.tv || 0)
      },
      helpfulQueries: Array.isArray(parsed.helpfulQueries) ? parsed.helpfulQueries : [],
      unhelpfulQueries: Array.isArray(parsed.unhelpfulQueries) ? parsed.unhelpfulQueries : []
    };
  } catch {
    return defaultStore();
  }
}

function saveStore(store: RankingFeedbackStore): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function boostScore(base: number, positive: number, negative: number): number {
  if (positive <= 0 && negative <= 0) return base;
  return base + positive * 0.035 - negative * 0.03;
}

export function scoreSearchResultForFeedback(item: SearchResult, store: RankingFeedbackStore): number {
  let score = item.confidence || 0;
  const genres = item.genre_ids || [];
  for (const genreId of genres) {
    score = boostScore(score, store.positiveGenres[genreId] || 0, store.negativeGenres[genreId] || 0);
  }
  score = boostScore(
    score,
    store.positiveMediaType[item.media_type] || 0,
    store.negativeMediaType[item.media_type] || 0
  );
  return score;
}

function uniquePush(input: string[], value: string): string[] {
  if (!value) return input;
  if (input.includes(value)) return input;
  return [value, ...input].slice(0, 40);
}

export function applyRankingFeedbackWithStore(results: SearchResult[], store: RankingFeedbackStore): SearchResult[] {
  if (!Array.isArray(results) || results.length < 2) return results;

  return [...results].sort((a, b) => {
    const scoreA = scoreSearchResultForFeedback(a, store);
    const scoreB = scoreSearchResultForFeedback(b, store);
    if (scoreA === scoreB) return (b.popularity || 0) - (a.popularity || 0);
    return scoreB - scoreA;
  });
}

export function applyRankingFeedback(results: SearchResult[]): SearchResult[] {
  if (!Array.isArray(results) || results.length < 2) return results;
  const store = loadStore();
  return applyRankingFeedbackWithStore(results, store);
}

export function recordResultFeedback(query: string, item: SearchResult, signal: FeedbackSignal): void {
  const store = loadStore();
  const next = { ...store };
  const isPositive = signal === 'up';
  const mediaType = item.media_type;
  const genres = item.genre_ids || [];

  if (isPositive) next.positiveMediaType[mediaType] += 1;
  else next.negativeMediaType[mediaType] += 1;

  for (const genreId of genres) {
    if (isPositive) next.positiveGenres[genreId] = (next.positiveGenres[genreId] || 0) + 1;
    else next.negativeGenres[genreId] = (next.negativeGenres[genreId] || 0) + 1;
  }

  const normalized = normalizeQuery(query);
  if (isPositive) next.helpfulQueries = uniquePush(next.helpfulQueries, normalized);
  else next.unhelpfulQueries = uniquePush(next.unhelpfulQueries, normalized);

  next.updatedAt = new Date().toISOString();
  saveStore(next);
}

export function recordQueryFeedback(query: string, helpful: boolean): void {
  const store = loadStore();
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  const next = { ...store };
  if (helpful) next.helpfulQueries = uniquePush(next.helpfulQueries, normalized);
  else next.unhelpfulQueries = uniquePush(next.unhelpfulQueries, normalized);
  next.updatedAt = new Date().toISOString();
  saveStore(next);
}
