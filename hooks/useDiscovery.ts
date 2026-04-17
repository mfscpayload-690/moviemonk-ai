import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiscoveryGenre, DiscoveryItem } from '../types';
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

export type DiscoverySnapshot = {
  heroItems: DiscoveryItem[];
  sections: DiscoverySection[];
  movieGenres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  selectedGenreItems: DiscoveryItem[];
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
  const settled = await Promise.allSettled([
    fetchTrending('all', 'week', { signal }),
    fetchTrending('movie', 'week', { signal }),
    fetchTrending('tv', 'week', { signal }),
    fetchUpcoming({ signal }),
    fetchNowPlaying({ signal }),
    fetchPopular('tv', { signal }),
    fetchOnTheAir({ signal }),
    fetchTopRated('movie', { signal }),
    fetchTopRated('tv', { signal }),
    fetchGenreList('movie', { signal }),
    fetchGenreList('tv', { signal })
  ]);

  const trendingAll = settled[0].status === 'fulfilled' ? settled[0].value : [];
  const trendingMovies = settled[1].status === 'fulfilled' ? settled[1].value : [];
  const trendingTv = settled[2].status === 'fulfilled' ? settled[2].value : [];
  const upcoming = settled[3].status === 'fulfilled' ? settled[3].value : [];
  const nowPlaying = settled[4].status === 'fulfilled' ? settled[4].value : [];
  const popularTv = settled[5].status === 'fulfilled' ? settled[5].value : [];
  const onTheAir = settled[6].status === 'fulfilled' ? settled[6].value : [];
  const topRatedMovies = settled[7].status === 'fulfilled' ? settled[7].value : [];
  const topRatedTv = settled[8].status === 'fulfilled' ? settled[8].value : [];
  const movieGenres = settled[9].status === 'fulfilled' ? settled[9].value : [];
  const tvGenres = settled[10].status === 'fulfilled' ? settled[10].value : [];

  const dramaGenreId = tvGenres.find((genre) => genre.name === 'Drama')?.id;

  const [bollywoodMovies, asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh] = await Promise.all([
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal }), [], 'bollywood discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'ja' }, { signal }), [], 'japanese discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'ko' }, { signal }), [], 'korean discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'zh' }, { signal }), [], 'chinese discovery'),
    settleOrDefault(fetchDiscoverMovie({ withOriginalLanguage: 'th' }, { signal }), [], 'thai discovery')
  ]);

  const asianMovies = mergeUniqueDiscoveryItems(asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh);

  const [koreanSeries, japaneseSeries, chineseSeries, thaiSeries] = await Promise.all([
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ko' }, { signal }), [], 'k-drama discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ja' }, { signal }), [], 'japanese series discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'zh' }, { signal }), [], 'chinese series discovery'),
    settleOrDefault(fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'th' }, { signal }), [], 'thai series discovery')
  ]);

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

  const curatedGenres = getCuratedMovieGenres(movieGenres);

  const strictPrefs = preferences || DEFAULT_PREFERENCE_SETTINGS;
  const strictEnabled = hasStrictPreferenceFilters(strictPrefs);

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

  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;
  const selectedGenreItems = selectedGenre
    ? await settleOrDefault(fetchByGenre(selectedGenre.id, 'movie', { signal }), [], 'genre picks')
    : [];

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
    selectedGenreItems
  };
}

export function useDiscovery() {
  const genreRequestRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const [heroItems, setHeroItems] = useState<DiscoveryItem[]>([]);
  const [sections, setSections] = useState<DiscoverySection[]>([]);
  const [movieGenres, setMovieGenres] = useState<DiscoveryGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryGenre | null>(null);
  const [selectedGenreItems, setSelectedGenreItems] = useState<DiscoveryItem[]>([]);
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

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }
    setError(null);

    const languageCodes = [...new Set([
      ...pickLanguageCodes(preferences.languages),
      ...pickRegionLanguageCodes(preferences.favoriteRegions)
    ])];
    const decadeRanges = parseDecadeRanges(preferences.favoriteDecades);
    setStrictLanguageCodes(languageCodes);
    setStrictDecadeRanges(decadeRanges);

    try {
      const snapshot = await loadDiscoverySnapshot(signal, preferences);
      if (signal?.aborted) return;
      setHeroItems(snapshot.heroItems);
      setSections(snapshot.sections);
      setMovieGenres(snapshot.movieGenres);
      setSelectedGenre(snapshot.selectedGenre);
      setSelectedGenreItems(snapshot.selectedGenreItems);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load discovery.');
      setHeroItems([]);
      setSections([]);
      setMovieGenres([]);
      setSelectedGenre(null);
      setSelectedGenreItems([]);
    } finally {
      if (!signal?.aborted) {
        hasLoadedOnceRef.current = true;
        setIsLoading(false);
      }
    }
  }, [preferences]);

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
    load(controller.signal);
    return () => controller.abort();
  }, [load, reloadToken]);

  const selectGenre = useCallback(async (genre: DiscoveryGenre) => {
    if (!genre) return;
    genreRequestRef.current?.abort();
    const controller = new AbortController();
    genreRequestRef.current = controller;
    setSelectedGenre(genre);
    setIsGenreLoading(true);
    try {
      const items = applyStrictFilters(
        await fetchByGenre(genre.id, 'movie', { signal: controller.signal }),
        strictLanguageCodes,
        strictDecadeRanges
      );
      if (controller.signal.aborted) return;
      setSelectedGenreItems(items);
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setError(err?.message || 'Failed to load genre titles.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsGenreLoading(false);
      }
    }
  }, [strictDecadeRanges, strictLanguageCodes]);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return useMemo(() => ({
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
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
    preferences,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  ]);
}
