import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiscoveryGenre, DiscoveryItem } from '../types';
import { emitClientError } from '../services/clientObservability';
import {
  DEFAULT_PREFERENCE_SETTINGS,
  UserPreferenceSettings,
  loadPreferenceSettings,
  savePreferenceSettings
} from '../lib/userSettings';
import {
  fetchByGenre,
  fetchDiscoverMovie,
  fetchDiscoverTv,
  fetchGenreList,
  fetchOnTheAir,
  fetchNowPlaying,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../services/tmdbService';

export type DiscoverySection = {
  key: string;
  title: string;
  items: DiscoveryItem[];
};

export type GenreRail = {
  genre: DiscoveryGenre;
  items: DiscoveryItem[];
  isLoading: boolean;
};

export type DiscoverySnapshot = {
  heroItems: DiscoveryItem[];
  sections: DiscoverySection[];
  movieGenres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  selectedGenreItems: DiscoveryItem[];
  genreRails?: GenreRail[];
};

const CURATED_GENRE_NAMES: string[] = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Science Fiction',
  'Romance',
  'Documentary',
  'Animation'
];

export function getCuratedMovieGenres(genres: DiscoveryGenre[]): DiscoveryGenre[] {
  const order = new Map(CURATED_GENRE_NAMES.map((name, index) => [name, index]));
  return genres
    .filter((genre) => order.has(genre.name))
    .sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
}

export function getPrioritizedGenreList(
  curatedGenres: DiscoveryGenre[],
  preferredGenreNames: string[] = []
): DiscoveryGenre[] {
  if (!curatedGenres.length) return [];
  const normalizedPreferred = preferredGenreNames.map((n) => n.trim().toLowerCase());
  const preferredMatches: DiscoveryGenre[] = [];
  const nonPreferred: DiscoveryGenre[] = [];

  // Default ordering: Action, Romance, Comedy, Drama, Horror, Science Fiction, Animation, Documentary
  const defaultOrder = ['Action', 'Romance', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Animation', 'Documentary'];
  const orderMap = new Map(defaultOrder.map((name, idx) => [name, idx]));
  const sortedCurated = [...curatedGenres].sort(
    (a, b) => (orderMap.get(a.name) ?? 99) - (orderMap.get(b.name) ?? 99)
  );

  sortedCurated.forEach((g) => {
    if (normalizedPreferred.includes(g.name.toLowerCase())) {
      preferredMatches.push(g);
    } else {
      nonPreferred.push(g);
    }
  });

  return [...preferredMatches, ...nonPreferred];
}

export function pickHeroItems(items: DiscoveryItem[], limit = 5): DiscoveryItem[] {
  return items.filter((item) => item.backdrop_url).slice(0, limit);
}

function getDiscoveryTitleKey(item: DiscoveryItem): string {
  return item.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function mergeUniqueDiscoveryItems(...groups: DiscoveryItem[][]): DiscoveryItem[] {
  const seenByEntity = new Set<string>();
  const merged: DiscoveryItem[] = [];

  groups.flat().forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seenByEntity.has(key)) return;
    seenByEntity.add(key);
    merged.push(item);
  });

  return merged;
}

export function buildBalancedMixRow(
  total: number,
  pools: Record<string, DiscoveryItem[]>,
  policy: Array<{ pool: string; ratio: number }>
): DiscoveryItem[] {
  const cappedTotal = Math.max(0, total);
  if (cappedTotal === 0 || policy.length === 0) return [];

  const prepared = new Map<string, DiscoveryItem[]>();
  policy.forEach(({ pool }) => {
    const seenTitles = new Set<string>();
    const source = pools[pool] || [];
    prepared.set(
      pool,
      source.filter((item) => {
        const titleKey = getDiscoveryTitleKey(item);
        if (!titleKey || seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return true;
      })
    );
  });

  const wanted = new Map<string, number>();
  let allocated = 0;
  policy.forEach(({ pool, ratio }) => {
    const count = Math.floor(cappedTotal * ratio);
    wanted.set(pool, count);
    allocated += count;
  });

  let remainingByRounding = cappedTotal - allocated;
  for (let i = 0; i < policy.length && remainingByRounding > 0; i += 1) {
    const pool = policy[i].pool;
    wanted.set(pool, (wanted.get(pool) || 0) + 1);
    remainingByRounding -= 1;
  }

  const takenByPool = new Map<string, number>();
  policy.forEach(({ pool }) => takenByPool.set(pool, 0));

  const selected: DiscoveryItem[] = [];
  const selectedTitles = new Set<string>();

  const takeFromPool = (pool: string, count: number) => {
    if (count <= 0) return 0;
    const items = prepared.get(pool) || [];
    let cursor = takenByPool.get(pool) || 0;
    let added = 0;

    while (cursor < items.length && added < count) {
      const candidate = items[cursor];
      cursor += 1;
      const titleKey = getDiscoveryTitleKey(candidate);
      if (!titleKey || selectedTitles.has(titleKey)) continue;
      selectedTitles.add(titleKey);
      selected.push(candidate);
      added += 1;
    }

    takenByPool.set(pool, cursor);
    return added;
  };

  policy.forEach(({ pool }) => {
    takeFromPool(pool, wanted.get(pool) || 0);
  });

  // Fallback fill in priority order when a pool is sparse.
  while (selected.length < cappedTotal) {
    let addedInPass = 0;
    for (let i = 0; i < policy.length && selected.length < cappedTotal; i += 1) {
      addedInPass += takeFromPool(policy[i].pool, 1);
    }
    if (addedInPass === 0) break;
  }

  return selected.slice(0, cappedTotal);
}

export function dedupeSectionsByTitle(sections: DiscoverySection[]): DiscoverySection[] {
  const seenTitles = new Set<string>();

  return sections.map((section) => {
    const uniqueItems = section.items.filter((item) => {
      const titleKey = getDiscoveryTitleKey(item);
      if (!titleKey || seenTitles.has(titleKey)) return false;
      seenTitles.add(titleKey);
      return true;
    });

    return {
      ...section,
      items: uniqueItems
    };
  });
}

type DecadeRange = { start: number; end: number };

const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: 'en',
  hindi: 'hi',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  japanese: 'ja',
  korean: 'ko',
  malayalam: 'ml',
  tamil: 'ta',
  telugu: 'te',
  portuguese: 'pt'
};

const REGION_LANGUAGE_CODE_MAP: Record<string, string[]> = {
  hollywood: ['en'],
  bollywood: ['hi'],
  'k-drama': ['ko'],
  anime: ['ja'],
  european: ['fr', 'de', 'es', 'it', 'pt'],
  'latin american': ['es', 'pt'],
  mollywood: ['ml'],
  'south indian': ['ta', 'te', 'ml', 'kn']
};

function parseDecadeRanges(decades: string[]): DecadeRange[] {
  return decades
    .map((decade) => {
      const match = decade.trim().match(/^(\d{4})s$/);
      if (!match) return null;
      const start = Number(match[1]);
      return { start, end: start + 9 };
    })
    .filter((range): range is DecadeRange => Boolean(range));
}

function pickLanguageCodes(languages: string[]): string[] {
  return languages
    .map((language) => LANGUAGE_CODE_MAP[language.trim().toLowerCase()])
    .filter((code): code is string => Boolean(code));
}

function pickRegionLanguageCodes(regions: string[]): string[] {
  const expanded = regions.flatMap((region) => REGION_LANGUAGE_CODE_MAP[region.trim().toLowerCase()] || []);
  return [...new Set(expanded)];
}

function isYearInRanges(yearText: string, ranges: DecadeRange[]): boolean {
  if (ranges.length === 0) return true;
  const year = Number(yearText);
  if (!Number.isFinite(year)) return false;
  return ranges.some((range) => year >= range.start && year <= range.end);
}

function applyStrictFilters(
  items: DiscoveryItem[],
  languageCodes: string[],
  decadeRanges: DecadeRange[]
): DiscoveryItem[] {
  return items.filter((item) => {
    const languageOk =
      languageCodes.length === 0 ||
      (typeof item.original_language === 'string' && languageCodes.includes(item.original_language));
    if (!languageOk) return false;
    return isYearInRanges(item.year, decadeRanges);
  });
}

async function fetchStrictDiscoverItems(
  mediaType: 'movie' | 'tv',
  genreIds: number[],
  languageCodes: string[],
  signal?: AbortSignal
): Promise<DiscoveryItem[]> {
  const calls = (languageCodes.length ? languageCodes : [undefined]).map((languageCode) => {
    if (mediaType === 'movie') {
      return fetchDiscoverMovie(
        {
          withGenres: genreIds.length ? genreIds : undefined,
          withOriginalLanguage: languageCode
        },
        { signal }
      );
    }

    return fetchDiscoverTv(
      {
        withGenres: genreIds.length ? genreIds : undefined,
        withOriginalLanguage: languageCode
      },
      { signal }
    );
  });

  const groups = await Promise.all(calls);
  return mergeUniqueDiscoveryItems(...groups);
}

function hasStrictPreferenceFilters(preferences: UserPreferenceSettings): boolean {
  return (
    preferences.genres.length > 0 ||
    preferences.languages.length > 0 ||
    preferences.favoriteDecades.length > 0 ||
    preferences.contentMix !== 'balanced'
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function preferencesEqual(a: UserPreferenceSettings, b: UserPreferenceSettings): boolean {
  return (
    arraysEqual(a.genres, b.genres) &&
    arraysEqual(a.languages, b.languages) &&
    arraysEqual(a.favoriteDecades, b.favoriteDecades) &&
    arraysEqual(a.favoriteRegions, b.favoriteRegions) &&
    a.contentMix === b.contentMix &&
    a.familySafe === b.familySafe &&
    a.reducedMotion === b.reducedMotion &&
    a.autoplayTrailers === b.autoplayTrailers &&
    a.cardDensity === b.cardDensity
  );
}

async function fetchCloudPreferences(userId: string): Promise<UserPreferenceSettings> {
  const module = await import('../services/userSettingsService');
  return module.fetchPreferenceSettings(userId);
}

async function settleOrDefault<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if ((error as { name?: string } | null)?.name === 'AbortError') {
      return fallback;
    }
    console.warn(`[discovery] ${label} failed`, error);
    return fallback;
  }
}

export async function loadDiscoverySnapshot(
  signal?: AbortSignal,
  preferences?: UserPreferenceSettings
): Promise<DiscoverySnapshot> {
  // ── Phase 1: Hero + essential sections (5 calls) ───────────────────────
  const settled = await Promise.allSettled([
    fetchTrending('all', 'week', { signal }),
    fetchTrending('movie', 'week', { signal }),
    fetchUpcoming({ signal }),
    fetchGenreList('movie', { signal }),
    fetchGenreList('tv', { signal })
  ]);

  const trendingAll = settled[0].status === 'fulfilled' ? settled[0].value : [];
  const trendingMovies = settled[1].status === 'fulfilled' ? settled[1].value : [];
  const upcoming = settled[2].status === 'fulfilled' ? settled[2].value : [];
  const movieGenres = settled[3].status === 'fulfilled' ? settled[3].value : [];
  const tvGenres = settled[4].status === 'fulfilled' ? settled[4].value : [];

  const curatedGenres = getCuratedMovieGenres(movieGenres);
  const strictPrefs = preferences || DEFAULT_PREFERENCE_SETTINGS;
  const strictEnabled = hasStrictPreferenceFilters(strictPrefs);

  // Handle strict personalization path early
  if (strictEnabled) {
    const languageCodes = [...new Set([
      ...pickLanguageCodes(strictPrefs.languages),
      ...pickRegionLanguageCodes(strictPrefs.favoriteRegions)
    ])];
    const decadeRanges = parseDecadeRanges(strictPrefs.favoriteDecades);

    const movieGenreIds = strictPrefs.genres
      .map((name) => movieGenres.find((genre) => genre.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is number => typeof id === 'number');

    const tvGenreIds = strictPrefs.genres
      .map((name) => tvGenres.find((genre) => genre.name.toLowerCase() === name.toLowerCase())?.id)
      .filter((id): id is number => typeof id === 'number');

    const [strictMoviesRaw, strictSeriesRaw] = await Promise.all([
      fetchStrictDiscoverItems('movie', movieGenreIds, languageCodes, signal),
      fetchStrictDiscoverItems('tv', tvGenreIds, languageCodes, signal)
    ]);

    const strictMovies = applyStrictFilters(strictMoviesRaw, languageCodes, decadeRanges);
    const strictSeries = applyStrictFilters(strictSeriesRaw, languageCodes, decadeRanges);

    const sections: DiscoverySection[] = [];
    if (strictPrefs.contentMix !== 'mostly_series') {
      sections.push({
        key: 'personalized-movies',
        title: 'Your Movies',
        items: strictMovies.slice(0, 24)
      });
    }
    if (strictPrefs.contentMix !== 'mostly_movies') {
      sections.push({
        key: 'personalized-series',
        title: 'Your Series',
        items: strictSeries.slice(0, 24)
      });
    }

    const heroPool = mergeUniqueDiscoveryItems(strictMovies, strictSeries);
    const preferredGenreName = strictPrefs.genres[0]?.toLowerCase();
    const selectedGenre =
      (preferredGenreName
        ? curatedGenres.find((genre) => genre.name.toLowerCase() === preferredGenreName)
        : null) ||
      curatedGenres[0] ||
      movieGenres[0] ||
      null;

    const selectedGenreItems = selectedGenre
      ? applyStrictFilters(
          await settleOrDefault(fetchByGenre(selectedGenre.id, 'movie', { signal }), [], 'strict genre discovery'),
          languageCodes,
          decadeRanges
        )
      : [];

    return {
      heroItems: pickHeroItems(heroPool.length ? heroPool : trendingAll),
      sections: dedupeSectionsByTitle(sections.filter((section) => section.items.length > 0)),
      movieGenres: curatedGenres,
      selectedGenre,
      selectedGenreItems
    };
  }

  // ── Phase 2: Deferred sections (non-blocking) ──────────────────────────
  const dramaGenreId = tvGenres.find((genre) => genre.name === 'Drama')?.id;

  const [
    trendingTv, nowPlaying, popularTv, onTheAir,
    topRatedMovies, topRatedTv,
    bollywoodMovies,
    asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh,
    koreanSeries, japaneseSeries, chineseSeries, thaiSeries,
    selectedGenreItemsRaw
  ] = await Promise.all([
    settleOrDefault(fetchTrending('tv', 'week', { signal }), [], 'trending tv'),
    settleOrDefault(fetchNowPlaying({ signal }), [], 'now playing'),
    settleOrDefault(fetchPopular('tv', { signal }), [], 'popular tv'),
    settleOrDefault(fetchOnTheAir({ signal }), [], 'on the air'),
    settleOrDefault(fetchTopRated('movie', { signal }), [], 'top rated movies'),
    settleOrDefault(fetchTopRated('tv', { signal }), [], 'top rated tv'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal }), [], 'bollywood discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'ja' }, { signal }), [], 'japanese discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'ko' }, { signal }), [], 'korean discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'zh' }, { signal }), [], 'chinese discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'th' }, { signal }), [], 'thai discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ko' }, { signal }), [], 'k-drama discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ja' }, { signal }), [], 'japanese series discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'zh' }, { signal }), [], 'chinese series discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'th' }, { signal }), [], 'thai series discovery'),
    (curatedGenres[0] || movieGenres[0])
      ? settleOrDefault(fetchByGenre((curatedGenres[0] || movieGenres[0]).id, 'movie', { signal }), [], 'genre picks')
      : Promise.resolve([] as DiscoveryItem[])
  ]);

  const asianMovies = mergeUniqueDiscoveryItems(asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh);

  const kDramaAndAsianSeries = mergeUniqueDiscoveryItems(
    koreanSeries,
    japaneseSeries,
    chineseSeries,
    thaiSeries
  ).slice(0, 24);

  const globalWebSeriesAndTv = mergeUniqueDiscoveryItems(onTheAir, topRatedTv, popularTv, trendingTv).slice(0, 24);
  const trendingMoviesMixed = buildBalancedMixRow(
    20,
    {
      global: trendingMovies,
      bollywood: bollywoodMovies,
      asian: asianMovies
    },
    [
      { pool: 'global', ratio: 0.7 },
      { pool: 'bollywood', ratio: 0.15 },
      { pool: 'asian', ratio: 0.15 }
    ]
  );

  const nowPlayingMixed = buildBalancedMixRow(
    20,
    {
      global: nowPlaying,
      bollywood: bollywoodMovies,
      asian: asianMovies
    },
    [
      { pool: 'global', ratio: 0.7 },
      { pool: 'bollywood', ratio: 0.15 },
      { pool: 'asian', ratio: 0.15 }
    ]
  );

  const topRatedMoviesAndSeries = mergeUniqueDiscoveryItems(topRatedMovies, topRatedTv).slice(0, 24);

  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;

  const prioritizedSections: DiscoverySection[] = [
    { key: 'trending-movies', title: 'Trending Movies', items: trendingMoviesMixed },
    { key: 'upcoming', title: 'Upcoming', items: upcoming },
    { key: 'now-playing-mix', title: 'Now Playing', items: nowPlayingMixed },
    { key: 'top-rated-movies-series', title: 'Top Rated Movies & Series', items: topRatedMoviesAndSeries },
    { key: 'global-web-series-tv', title: 'Global Web Series and TV Shows', items: globalWebSeriesAndTv },
    { key: 'kdrama-asian-series', title: 'K-Drama and Asian Series', items: kDramaAndAsianSeries }
  ];

  return {
    heroItems: pickHeroItems(trendingAll),
    sections: dedupeSectionsByTitle(prioritizedSections),
    movieGenres: curatedGenres,
    selectedGenre,
    selectedGenreItems: selectedGenreItemsRaw
  };
}

export const DISCOVERY_SNAPSHOT_CACHE_PREFIX = 'mm_discovery_snapshot_v2:';
export const DISCOVERY_FRESH_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const DISCOVERY_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface CachedDiscoverySnapshot {
  snapshot: DiscoverySnapshot;
  timestamp: number;
}

const memorySnapshotCache = new Map<string, CachedDiscoverySnapshot>();

export function getDiscoveryPreferencesHash(prefs: UserPreferenceSettings): string {
  const parts = [
    (prefs.genres || []).slice().sort().join(','),
    (prefs.languages || []).slice().sort().join(','),
    (prefs.favoriteDecades || []).slice().sort().join(','),
    (prefs.favoriteRegions || []).slice().sort().join(','),
    prefs.contentMix || 'balanced'
  ];
  return parts.join('|');
}

export function getCachedDiscoverySnapshot(
  preferences?: UserPreferenceSettings
): { snapshot: DiscoverySnapshot; isFresh: boolean } | null {
  const prefs = preferences || DEFAULT_PREFERENCE_SETTINGS;
  const hash = getDiscoveryPreferencesHash(prefs);
  const key = `${DISCOVERY_SNAPSHOT_CACHE_PREFIX}${hash}`;
  const now = Date.now();

  try {
    let entry: CachedDiscoverySnapshot | null = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        entry = JSON.parse(raw) as CachedDiscoverySnapshot;
      }
    }

    if (!entry) {
      entry = memorySnapshotCache.get(key) || null;
    }

    if (!entry || !entry.snapshot || !Number.isFinite(entry.timestamp)) {
      return null;
    }

    const hasItems =
      (entry.snapshot.heroItems && entry.snapshot.heroItems.length > 0) ||
      (entry.snapshot.sections && entry.snapshot.sections.some((s) => s.items && s.items.length > 0));

    if (!hasItems) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
      }
      memorySnapshotCache.delete(key);
      return null;
    }

    const age = now - entry.timestamp;
    if (age > DISCOVERY_MAX_AGE_MS) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
      }
      memorySnapshotCache.delete(key);
      return null;
    }

    return {
      snapshot: entry.snapshot,
      isFresh: age < DISCOVERY_FRESH_TTL_MS
    };
  } catch {
    return null;
  }
}

export function setCachedDiscoverySnapshot(
  snapshot: DiscoverySnapshot,
  preferences?: UserPreferenceSettings
): void {
  // Avoid caching empty snapshots caused by network or backend startup delays
  const hasItems =
    (snapshot.heroItems && snapshot.heroItems.length > 0) ||
    (snapshot.sections && snapshot.sections.some((s) => s.items && s.items.length > 0));
  if (!hasItems) {
    return;
  }
  const prefs = preferences || DEFAULT_PREFERENCE_SETTINGS;
  const hash = getDiscoveryPreferencesHash(prefs);
  const key = `${DISCOVERY_SNAPSHOT_CACHE_PREFIX}${hash}`;
  const entry: CachedDiscoverySnapshot = {
    snapshot,
    timestamp: Date.now()
  };

  memorySnapshotCache.set(key, entry);

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(key, JSON.stringify(entry));
    }
  } catch {
    // sessionStorage full or quota exceeded — in-memory cache acts as fallback
  }
}

export function clearCachedDiscoverySnapshot(preferences?: UserPreferenceSettings): void {
  const prefs = preferences || DEFAULT_PREFERENCE_SETTINGS;
  const hash = getDiscoveryPreferencesHash(prefs);
  const key = `${DISCOVERY_SNAPSHOT_CACHE_PREFIX}${hash}`;
  memorySnapshotCache.delete(key);
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export const GENRE_RAILS_CACHE_KEY_PREFIX = 'mm_genre_rails_cache_v2:';
export const GENRE_RAILS_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface CachedGenreRailEntry {
  items: DiscoveryItem[];
  timestamp: number;
}

const memoryGenreRailsCache = new Map<string, CachedGenreRailEntry>();

function getGenreRailsStorageKey(prefs?: UserPreferenceSettings): string {
  const hash = getDiscoveryPreferencesHash(prefs || DEFAULT_PREFERENCE_SETTINGS);
  return `${GENRE_RAILS_CACHE_KEY_PREFIX}${hash}`;
}

export function getCachedGenreItems(genreId: number, prefs?: UserPreferenceSettings): DiscoveryItem[] | null {
  const hash = getDiscoveryPreferencesHash(prefs || DEFAULT_PREFERENCE_SETTINGS);
  const memKey = `${hash}:${genreId}`;
  const now = Date.now();
  const mem = memoryGenreRailsCache.get(memKey);
  if (mem && Array.isArray(mem.items) && now - mem.timestamp < GENRE_RAILS_TTL_MS) {
    return mem.items;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getGenreRailsStorageKey(prefs));
    if (!raw) return null;
    const parsed: Record<string, CachedGenreRailEntry> = JSON.parse(raw);
    const entry = parsed[String(genreId)];
    if (entry && Array.isArray(entry.items) && now - entry.timestamp < GENRE_RAILS_TTL_MS) {
      memoryGenreRailsCache.set(memKey, entry);
      return entry.items;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setCachedGenreItems(
  genreId: number,
  items: DiscoveryItem[],
  prefs?: UserPreferenceSettings
): void {
  if (!items || items.length === 0) return;
  const hash = getDiscoveryPreferencesHash(prefs || DEFAULT_PREFERENCE_SETTINGS);
  const memKey = `${hash}:${genreId}`;
  const now = Date.now();
  const entry: CachedGenreRailEntry = { items, timestamp: now };
  memoryGenreRailsCache.set(memKey, entry);

  if (typeof window === 'undefined') return;
  try {
    const key = getGenreRailsStorageKey(prefs);
    const raw = localStorage.getItem(key);
    const parsed: Record<string, CachedGenreRailEntry> = raw ? JSON.parse(raw) : {};
    const cleaned: Record<string, CachedGenreRailEntry> = {};
    Object.entries(parsed).forEach(([k, val]) => {
      if (val && now - val.timestamp < GENRE_RAILS_TTL_MS) {
        cleaned[k] = val;
      }
    });
    cleaned[String(genreId)] = entry;
    localStorage.setItem(key, JSON.stringify(cleaned));
  } catch {
    // quota exceeded fallback
  }
}

export function getAllCachedGenreItems(prefs?: UserPreferenceSettings): Record<number, DiscoveryItem[]> {
  const hash = getDiscoveryPreferencesHash(prefs || DEFAULT_PREFERENCE_SETTINGS);
  const now = Date.now();
  const result: Record<number, DiscoveryItem[]> = {};
  const prefix = `${hash}:`;

  memoryGenreRailsCache.forEach((entry, k) => {
    if (k.startsWith(prefix) && entry && Array.isArray(entry.items) && now - entry.timestamp < GENRE_RAILS_TTL_MS) {
      const id = Number(k.slice(prefix.length));
      result[id] = entry.items;
    }
  });

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getGenreRailsStorageKey(prefs));
      if (raw) {
        const parsed: Record<string, CachedGenreRailEntry> = JSON.parse(raw);
        Object.entries(parsed).forEach(([key, val]) => {
          const id = Number(key);
          if (val && Array.isArray(val.items) && now - val.timestamp < GENRE_RAILS_TTL_MS && !result[id]) {
            result[id] = val.items;
            memoryGenreRailsCache.set(`${hash}:${id}`, val);
          }
        });
      }
    } catch {
      // ignore
    }
  }

  return result;
}

export function clearCachedGenreItems(prefs?: UserPreferenceSettings): void {
  if (prefs) {
    const hash = getDiscoveryPreferencesHash(prefs);
    const prefix = `${hash}:`;
    Array.from(memoryGenreRailsCache.keys()).forEach((k) => {
      if (k.startsWith(prefix)) memoryGenreRailsCache.delete(k);
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getGenreRailsStorageKey(prefs));
      } catch {
        // ignore
      }
    }
  } else {
    memoryGenreRailsCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(GENRE_RAILS_CACHE_KEY_PREFIX) || k === 'mm_genre_rails_cache_v1') {
            localStorage.removeItem(k);
          }
        });
      } catch {
        // ignore
      }
    }
  }
}

export function useDiscovery() {
  const genreRequestRef = useRef<AbortController | null>(null);
  const genreCacheRef = useRef<Map<number, DiscoveryItem[]>>(new Map());
  const inFlightGenreRequestsRef = useRef<Set<number>>(new Set());
  const hasLoadedOnceRef = useRef(false);
  const [heroItems, setHeroItems] = useState<DiscoveryItem[]>([]);
  const [sections, setSections] = useState<DiscoverySection[]>([]);
  const [movieGenres, setMovieGenres] = useState<DiscoveryGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryGenre | null>(null);
  const [selectedGenreItems, setSelectedGenreItems] = useState<DiscoveryItem[]>([]);
  const [genreRails, setGenreRails] = useState<GenreRail[]>([]);
  const [isLoadingMoreGenres, setIsLoadingMoreGenres] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferenceSettings>(loadPreferenceSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [strictLanguageCodes, setStrictLanguageCodes] = useState<string[]>([]);
  const [strictDecadeRanges, setStrictDecadeRanges] = useState<DecadeRange[]>([]);
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const module = await import('../lib/supabase');
        if (!module.isSupabaseConfigured || !module.supabase || !active) return;
        const { data } = await module.supabase.auth.getSession();
        if (!active) return;
        setAuthUserId(data.session?.user?.id);
      } catch {
        // If auth lookup fails, discovery still works with local preferences.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const applySnapshotToRails = useCallback((
    snap: DiscoverySnapshot,
    languageCodes: string[],
    decadeRanges: DecadeRange[]
  ) => {
    const prioritized = getPrioritizedGenreList(snap.movieGenres, preferences.genres);
    const cachedAll = getAllCachedGenreItems(preferences);

    // Initial 2 target genres
    const top2 = prioritized.slice(0, 2);
    const initialRails: GenreRail[] = [];

    top2.forEach((g) => {
      const isSelected =
        snap.selectedGenre && snap.selectedGenre.id === g.id && snap.selectedGenreItems.length > 0;
      const items = isSelected ? snap.selectedGenreItems : (cachedAll[g.id] || []);
      if (items.length > 0) {
        setCachedGenreItems(g.id, items, preferences);
        genreCacheRef.current.set(g.id, items);
      }
      initialRails.push({ genre: g, items, isLoading: items.length === 0 });
    });

    // Also restore any previously loaded genres from localStorage cache
    Object.entries(cachedAll).forEach(([idStr, items]) => {
      const id = Number(idStr);
      if (!top2.some((g) => g.id === id)) {
        const matchedGenre = snap.movieGenres.find((g) => g.id === id);
        if (matchedGenre && items.length > 0) {
          genreCacheRef.current.set(id, items);
          initialRails.push({ genre: matchedGenre, items, isLoading: false });
        }
      }
    });

    setGenreRails(initialRails);

    // Background-fetch every initial rail that has no items yet
    initialRails
      .filter((r) => r.isLoading)
      .forEach(({ genre }) => {
        if (inFlightGenreRequestsRef.current.has(genre.id)) return;
        inFlightGenreRequestsRef.current.add(genre.id);
        void (async () => {
          try {
            const raw = await fetchByGenre(genre.id, 'movie');
            const items = applyStrictFilters(raw, languageCodes, decadeRanges);
            setCachedGenreItems(genre.id, items, preferences);
            genreCacheRef.current.set(genre.id, items);
            setGenreRails((prev) =>
              prev.map((r) => (r.genre.id === genre.id ? { ...r, items, isLoading: false } : r))
            );
          } catch {
            setGenreRails((prev) =>
              prev.map((r) => (r.genre.id === genre.id ? { ...r, isLoading: false } : r))
            );
          } finally {
            inFlightGenreRequestsRef.current.delete(genre.id);
          }
        })();
      });
  }, [preferences]);

  const load = useCallback(async (signal?: AbortSignal, forceFresh = false) => {
    const cachedEntry = !forceFresh ? getCachedDiscoverySnapshot(preferences) : null;

    const languageCodes = [...new Set([
      ...pickLanguageCodes(preferences.languages),
      ...pickRegionLanguageCodes(preferences.favoriteRegions)
    ])];
    const decadeRanges = parseDecadeRanges(preferences.favoriteDecades);
    setStrictLanguageCodes(languageCodes);
    setStrictDecadeRanges(decadeRanges);

    if (cachedEntry) {
      setHeroItems(cachedEntry.snapshot.heroItems);
      setSections(cachedEntry.snapshot.sections);
      setMovieGenres(cachedEntry.snapshot.movieGenres);
      setSelectedGenre(cachedEntry.snapshot.selectedGenre);
      setSelectedGenreItems(cachedEntry.snapshot.selectedGenreItems);
      if (cachedEntry.snapshot.selectedGenre) {
        genreCacheRef.current.set(cachedEntry.snapshot.selectedGenre.id, cachedEntry.snapshot.selectedGenreItems);
      }
      applySnapshotToRails(cachedEntry.snapshot, languageCodes, decadeRanges);
      hasLoadedOnceRef.current = true;
      setIsLoading(false);

      if (cachedEntry.isFresh) {
        return;
      }
    } else if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const snapshot = await loadDiscoverySnapshot(signal, preferences);
      if (signal?.aborted) return;
      setHeroItems(snapshot.heroItems);
      setSections(snapshot.sections);
      setMovieGenres(snapshot.movieGenres);
      setSelectedGenre(snapshot.selectedGenre);
      setSelectedGenreItems(snapshot.selectedGenreItems);
      if (snapshot.selectedGenre) {
        genreCacheRef.current.set(snapshot.selectedGenre.id, snapshot.selectedGenreItems);
      }
      applySnapshotToRails(snapshot, languageCodes, decadeRanges);
      setCachedDiscoverySnapshot(snapshot, preferences);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      emitClientError(err, { context: 'load_discovery_snapshot' });
      if (!cachedEntry) {
        setError('Failed to load discovery content. Please try again.');
        setHeroItems([]);
        setSections([]);
        setMovieGenres([]);
        setSelectedGenre(null);
        setSelectedGenreItems([]);
        setGenreRails([]);
      }
    } finally {
      if (!signal?.aborted) {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
      }
    }
  }, [applySnapshotToRails, preferences]);

  useEffect(() => {
    const local = loadPreferenceSettings();
    setPreferences((current) => (preferencesEqual(current, local) ? current : local));
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes('moviemonk_preference_settings_v1')) {
        const local = loadPreferenceSettings();
        setPreferences((current) => (preferencesEqual(current, local) ? current : local));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!authUserId) return;
    let active = true;
    void (async () => {
      try {
        const cloudPrefs = await fetchCloudPreferences(authUserId);
        if (!active) return;
        savePreferenceSettings(cloudPrefs);
        setPreferences((current) => (preferencesEqual(current, cloudPrefs) ? current : cloudPrefs));
      } catch {
        // Keep local fallback preferences.
      }
    })();
    return () => {
      active = false;
    };
  }, [authUserId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal, reloadToken > 0);
    return () => controller.abort();
  }, [load, reloadToken]);

  const loadSpecificGenre = useCallback(async (genre: DiscoveryGenre) => {
    if (!genre) return;
    genreRequestRef.current?.abort();
    setSelectedGenre(genre);

    const cached = genreCacheRef.current.get(genre.id) || getCachedGenreItems(genre.id, preferences);

    setGenreRails((prev) => {
      const exists = prev.some((r) => r.genre.id === genre.id);
      if (exists) {
        if (cached && cached.length > 0) {
          return prev.map((r) => (r.genre.id === genre.id ? { ...r, items: cached, isLoading: false } : r));
        }
        return prev;
      }
      return [...prev, { genre, items: cached || [], isLoading: !cached || cached.length === 0 }];
    });

    if (cached && cached.length > 0) {
      genreCacheRef.current.set(genre.id, cached);
      setSelectedGenreItems(cached);
      setIsGenreLoading(false);
      return;
    }

    if (inFlightGenreRequestsRef.current.has(genre.id)) return;
    inFlightGenreRequestsRef.current.add(genre.id);

    const controller = new AbortController();
    genreRequestRef.current = controller;
    setIsGenreLoading(true);

    try {
      const raw = await fetchByGenre(genre.id, 'movie', { signal: controller.signal });
      const items = applyStrictFilters(raw, strictLanguageCodes, strictDecadeRanges);
      if (controller.signal.aborted) return;
      genreCacheRef.current.set(genre.id, items);
      setCachedGenreItems(genre.id, items, preferences);
      setSelectedGenreItems(items);
      setGenreRails((prev) =>
        prev.map((r) => (r.genre.id === genre.id ? { ...r, items, isLoading: false } : r))
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        emitClientError(err, { context: 'load_specific_genre_rail', genreId: genre.id, genreName: genre.name });
        setError('Failed to load genre titles. Please try again.');
        setGenreRails((prev) => prev.filter((r) => r.genre.id !== genre.id));
      }
    } finally {
      inFlightGenreRequestsRef.current.delete(genre.id);
      if (!controller.signal.aborted) {
        setIsGenreLoading(false);
      }
    }
  }, [preferences, strictDecadeRanges, strictLanguageCodes]);

  const loadMoreGenres = useCallback(async () => {
    if (isLoadingMoreGenres || !movieGenres.length) return;
    const prioritized = getPrioritizedGenreList(movieGenres, preferences.genres);
    const currentLoadedIds = new Set(genreRails.map((r) => r.genre.id));
    const nextGenresToLoad = prioritized.filter((g) => !currentLoadedIds.has(g.id)).slice(0, 2);
    if (nextGenresToLoad.length === 0) return;

    // Immediately add skeleton placeholders
    setGenreRails((prev) => [
      ...prev,
      ...nextGenresToLoad.map((g) => ({ genre: g, items: [], isLoading: true }))
    ]);
    setIsLoadingMoreGenres(true);

    try {
      await Promise.all(
        nextGenresToLoad.map(async (genre) => {
          const cached = genreCacheRef.current.get(genre.id) || getCachedGenreItems(genre.id, preferences);
          if (cached && cached.length > 0) {
            genreCacheRef.current.set(genre.id, cached);
            setGenreRails((prev) =>
              prev.map((r) => (r.genre.id === genre.id ? { ...r, items: cached, isLoading: false } : r))
            );
            return;
          }

          try {
            const raw = await fetchByGenre(genre.id, 'movie');
            const items = applyStrictFilters(raw, strictLanguageCodes, strictDecadeRanges);
            setCachedGenreItems(genre.id, items, preferences);
            genreCacheRef.current.set(genre.id, items);
            setGenreRails((prev) =>
              prev.map((r) => (r.genre.id === genre.id ? { ...r, items, isLoading: false } : r))
            );
          } catch (err: any) {
            emitClientError(err, { context: 'load_more_genre_rail', genreId: genre.id, genreName: genre.name });
            setGenreRails((prev) => prev.filter((r) => r.genre.id !== genre.id));
          }
        })
      );
    } finally {
      setIsLoadingMoreGenres(false);
    }
  }, [genreRails, isLoadingMoreGenres, movieGenres, preferences, strictDecadeRanges, strictLanguageCodes]);

  const selectGenre = loadSpecificGenre;

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return useMemo(() => ({
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    genreRails,
    loadMoreGenres,
    loadSpecificGenre,
    isLoadingMoreGenres,
    cardDensity: preferences.cardDensity,
    isStrictPersonalized: hasStrictPreferenceFilters(preferences),
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  }), [
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    genreRails,
    loadMoreGenres,
    loadSpecificGenre,
    isLoadingMoreGenres,
    preferences,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  ]);
}
