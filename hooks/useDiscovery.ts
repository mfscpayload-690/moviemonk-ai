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

function mergeUniqueDiscoveryItems(...groups: DiscoveryItem[][]): DiscoveryItem[] {
  const seen = new Set<string>();
  const merged: DiscoveryItem[] = [];

  groups.flat().forEach((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  return merged;
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

  const [bollywoodMovies, asianMovies] = await Promise.all([
    fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'ja' }, { signal })
  ]);

  const [asianNowPlayingCandidates, bollywoodNowPlayingCandidates] = await Promise.all([
    fetchDiscoverMovie({ withOriginalLanguage: 'ko' }, { signal }),
    fetchDiscoverMovie({ withOriginalLanguage: 'hi' }, { signal })
  ]);

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
  const trendingMoviesMixed = mergeUniqueDiscoveryItems(
    trendingMovies.slice(0, 18),
    bollywoodMovies.slice(0, 1),
    asianMovies.slice(0, 1)
  ).slice(0, 20);

  const nowPlayingMixed = mergeUniqueDiscoveryItems(
    nowPlaying.slice(0, 16),
    bollywoodNowPlayingCandidates.slice(0, 2),
    asianNowPlayingCandidates.slice(0, 2)
  ).slice(0, 20);

  const topRatedMoviesAndSeries = mergeUniqueDiscoveryItems(topRatedMovies, topRatedTv).slice(0, 24);

  const curatedGenres = getCuratedMovieGenres(movieGenres);
  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;
  const selectedGenreItems = selectedGenre
    ? await fetchByGenre(selectedGenre.id, 'movie', { signal })
    : [];

  return {
    heroItems: pickHeroItems(trendingAll),
    sections: [
      { key: 'trending-movies', title: 'Trending Movies', items: trendingMoviesMixed },
      { key: 'upcoming', title: 'Upcoming', items: upcoming },
      { key: 'now-playing-mix', title: 'Now Playing', items: nowPlayingMixed },
      { key: 'top-rated-movies-series', title: 'Top Rated Movies & Series', items: topRatedMoviesAndSeries },
      { key: 'global-web-series-tv', title: 'Global Web Series and TV Shows', items: globalWebSeriesAndTv },
      { key: 'kdrama-asian-series', title: 'K-Drama and Asian Series', items: kDramaAndAsianSeries }
    ],
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
