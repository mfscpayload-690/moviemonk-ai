import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DiscoveryGenre, DiscoveryItem } from '../types';
import {
  fetchByGenre,
  fetchGenreList,
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

const CURATED_GENRE_NAMES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Science Fiction',
  'Romance',
  'Documentary',
  'Animation'
] as const;

export function getCuratedMovieGenres(genres: DiscoveryGenre[]): DiscoveryGenre[] {
  const order = new Map(CURATED_GENRE_NAMES.map((name, index) => [name, index]));
  return genres
    .filter((genre) => order.has(genre.name))
    .sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
}

export function pickHeroItems(items: DiscoveryItem[], limit = 5): DiscoveryItem[] {
  return items.filter((item) => item.backdrop_url).slice(0, limit);
}

export async function loadDiscoverySnapshot(signal?: AbortSignal): Promise<DiscoverySnapshot> {
  const [
    trendingAll,
    trendingMovies,
    popularTv,
    topRatedMovies,
    nowPlaying,
    upcoming,
    movieGenres
  ] = await Promise.all([
    fetchTrending('all', 'week', { signal }),
    fetchTrending('movie', 'week', { signal }),
    fetchPopular('tv', { signal }),
    fetchTopRated('movie', { signal }),
    fetchNowPlaying({ signal }),
    fetchUpcoming({ signal }),
    fetchGenreList('movie', { signal })
  ]);

  const curatedGenres = getCuratedMovieGenres(movieGenres);
  const selectedGenre = curatedGenres[0] || movieGenres[0] || null;
  const selectedGenreItems = selectedGenre
    ? await fetchByGenre(selectedGenre.id, 'movie', { signal })
    : [];

  return {
    heroItems: pickHeroItems(trendingAll),
    sections: [
      { key: 'trending-movies', title: 'Trending Movies', items: trendingMovies },
      { key: 'popular-tv', title: 'Popular TV Shows', items: popularTv },
      { key: 'top-rated-movies', title: 'Top Rated Movies', items: topRatedMovies },
      { key: 'now-playing', title: 'Now Playing', items: nowPlaying },
      { key: 'upcoming', title: 'Upcoming', items: upcoming }
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
