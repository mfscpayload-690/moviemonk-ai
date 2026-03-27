import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiscoveryGenre, DiscoveryItem } from '../types';
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

export async function loadDiscoverySnapshot(signal?: AbortSignal): Promise<DiscoverySnapshot> {
  const [
    trendingAll,
    trendingMovies,
    trendingTv,
    upcoming,
    nowPlaying,
    popularTv,
    onTheAir,
    topRatedMovies,
    topRatedTv,
    movieGenres,
    tvGenres
  ] = await Promise.all([
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

  const dramaGenreId = tvGenres.find((genre) => genre.name === 'Drama')?.id;

  const [bollywoodMovies, asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh] = await Promise.all([
    fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'ja' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'ko' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'zh' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'th' }, { signal })
  ]);

  const asianMovies = mergeUniqueDiscoveryItems(asianMoviesJa, asianMoviesKo, asianMoviesZh, asianMoviesTh);

  const [koreanSeries, japaneseSeries, chineseSeries, thaiSeries] = await Promise.all([
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ko' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'ja' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'zh' }, { signal }),
    fetchDiscoverTv({ withGenres: dramaGenreId ? [dramaGenreId] : undefined, withOriginalLanguage: 'th' }, { signal })
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
  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;
  const selectedGenreItems = selectedGenre
    ? await fetchByGenre(selectedGenre.id, 'movie', { signal })
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
  const [heroItems, setHeroItems] = useState<DiscoveryItem[]>([]);
  const [sections, setSections] = useState<DiscoverySection[]>([]);
  const [movieGenres, setMovieGenres] = useState<DiscoveryGenre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryGenre | null>(null);
  const [selectedGenreItems, setSelectedGenreItems] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await loadDiscoverySnapshot(signal);
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
        setIsLoading(false);
      }
    }
  }, []);

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
      const items = await fetchByGenre(genre.id, 'movie', { signal: controller.signal });
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
  }, []);

  const retry = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  return useMemo(() => ({
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
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
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  ]);
}
