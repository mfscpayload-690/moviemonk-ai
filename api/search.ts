import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';

const SEARCH_CACHE_TTL_SECONDS = 60;
const MAX_RESULTS_PER_PAGE = 20;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// TMDB genre map for display names
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

type SearchResultRecord = {
  id: number;
  title: string;
  year?: string;
  type: 'movie' | 'show';
  media_type: 'movie' | 'tv';
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  summary_snippet?: string;
  rating?: number;
  genre_ids?: number[];
  genres?: string[];
  confidence: number;
  popularity?: number;
  original_language?: string;
};

type PersonCandidate = {
  id: number;
  name: string;
  type: 'person';
  score: number;
  confidence: number;
  popularity?: number;
  known_for_department?: string;
  known_for_titles?: string[];
  profile_url?: string;
};

type MediaTypeFilter = 'all' | 'movie' | 'tv';

function normalizeMediaTypeFilter(raw: string): MediaTypeFilter {
  const normalized = String(raw || 'all').toLowerCase();
  if (normalized === 'movie') return 'movie';
  if (normalized === 'tv' || normalized === 'show') return 'tv';
  return 'all';
}

function parseNumber(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseGenreFilters(raw: unknown): number[] {
  if (!raw) return [];
  const asText = String(raw).trim();
  if (!asText) return [];

  return asText
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function mapTmdbToSearchResult(item: any): SearchResultRecord | null {
  const mediaType: string = item?.media_type;
  if (!mediaType || !['movie', 'tv'].includes(mediaType)) return null;

  const title = item.title || item.name;
  if (!title) return null;

  const yearSource = item.release_date || item.first_air_date;
  const year = typeof yearSource === 'string' && yearSource.length >= 4
    ? yearSource.slice(0, 4)
    : undefined;

  const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const genres = genreIds
    .map((id: number) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, 4);

  const overview: string | undefined = item.overview || undefined;
  const summarySnippet = overview
    ? (overview.length > 150 ? `${overview.slice(0, 147)}...` : overview)
    : undefined;

  return {
    id: item.id,
    title,
    year,
    type: mediaType === 'tv' ? 'show' : 'movie',
    media_type: mediaType === 'tv' ? 'tv' : 'movie',
    poster_url: item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : undefined,
    backdrop_url: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
      : undefined,
    overview,
    summary_snippet: summarySnippet,
    rating: typeof item.vote_average === 'number' && item.vote_average > 0
      ? Math.round(item.vote_average * 10) / 10
      : undefined,
    genre_ids: genreIds,
    genres,
    confidence: typeof item.popularity === 'number' ? Math.min(item.popularity / 100, 1) : 0.5,
    popularity: item.popularity,
    original_language: item.original_language,
  };
}

function mapTmdbToPerson(item: any): PersonCandidate | null {
  const mediaType: string = item?.media_type;
  if (mediaType !== 'person') return null;

  const name = item.name;
  if (!name) return null;

  const knownForTitles = Array.isArray(item.known_for)
    ? item.known_for
        .map((k: any) => k?.title || k?.name)
        .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
    : undefined;

  return {
    id: item.id,
    name,
    type: 'person',
    score: typeof item.popularity === 'number' ? item.popularity : 0,
    confidence: typeof item.popularity === 'number' ? Math.min(item.popularity / 50, 1) : 0.5,
    popularity: item.popularity,
    known_for_department: item.known_for_department,
    known_for_titles: knownForTitles,
    profile_url: item.profile_path
      ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
      : undefined,
  };
}

function matchesType(item: SearchResultRecord, mediaTypeFilter: MediaTypeFilter): boolean {
  if (mediaTypeFilter === 'all') return true;
  return item.media_type === mediaTypeFilter;
}

function applyTitleFilters(
  input: SearchResultRecord[],
  params: {
    mediaTypeFilter: MediaTypeFilter;
    genreFilters: number[];
    ratingMin: number | null;
    yearMin: number | null;
    yearMax: number | null;
  }
): SearchResultRecord[] {
  const { mediaTypeFilter, genreFilters, ratingMin, yearMin, yearMax } = params;

  return input.filter((item) => {
    if (!matchesType(item, mediaTypeFilter)) return false;

    if (genreFilters.length > 0) {
      const itemGenres = item.genre_ids || [];
      const hasAnyGenre = genreFilters.some((genreId) => itemGenres.includes(genreId));
      if (!hasAnyGenre) return false;
    }

    if (ratingMin !== null && (item.rating ?? 0) < ratingMin) {
      return false;
    }

    if (yearMin !== null || yearMax !== null) {
      const yearNum = item.year ? Number(item.year) : NaN;
      if (!Number.isFinite(yearNum)) return false;
      if (yearMin !== null && yearNum < yearMin) return false;
      if (yearMax !== null && yearNum > yearMax) return false;
    }

    return true;
  });
}

async function tmdbSearchMulti(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  query: string,
  page: number
): Promise<any> {
  const url = new URL(`${TMDB_BASE}/search/multi`);
  url.searchParams.set('query', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('include_adult', 'false');

  if (tmdbApiKey) {
    url.searchParams.set('api_key', tmdbApiKey);
  }

  const headers: Record<string, string> = tmdbReadToken
    ? { Authorization: `Bearer ${tmdbReadToken}` }
    : {};

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB search failed: ${response.status}`);
  }
  return response.json();
}

function buildDidYouMean(query: string, page1MappedTitles: SearchResultRecord[]): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const item of page1MappedTitles) {
    const title = item.title.trim();
    const normalizedTitle = title.toLowerCase();
    if (!title || normalizedTitle === normalizedQuery || seen.has(normalizedTitle)) continue;
    seen.add(normalizedTitle);
    suggestions.push(title);
    if (suggestions.length >= 3) break;
  }

  return suggestions;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/search');
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (!['GET', 'POST'].includes(req.method || '')) {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const input = req.method === 'POST' ? (req.body || {}) : req.query;

  const q = String(input.q || '').trim();
  if (q.length < 1) {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Query is required');
  }

  const page = Math.max(1, parseInt(String(input.page || '1'), 10) || 1);
  const mediaTypeFilter = normalizeMediaTypeFilter(String(input.type || 'all'));
  const sortBy = String(input.sortBy || 'popularity.desc');
  const genreFilters = parseGenreFilters(input.genres ?? input.genre);
  const ratingMin = parseNumber(input.ratingMin);
  const yearMinRaw = parseNumber(input.yearMin);
  const yearMaxRaw = parseNumber(input.yearMax);
  const exactYear = parseNumber(input.year);
  const yearMin = exactYear ?? yearMinRaw;
  const yearMax = exactYear ?? yearMaxRaw;

  try {
    const cacheKey = withCacheKey('search_v1', {
      q: q.toLowerCase(),
      page,
      type: mediaTypeFilter,
      sortBy,
      genres: genreFilters.join(','),
      yearMin: yearMin ?? '',
      yearMax: yearMax ?? '',
      ratingMin: ratingMin ?? '',
    });

    const cached = await getCache(cacheKey);
    if (cached) {
      obs.finish(200, { cached: true, total: cached.total_results || 0 });
      return res.status(200).json({ ...cached, cached: true });
    }

    const tmdbKey = process.env.TMDB_API_KEY;
    const tmdbReadToken = process.env.TMDB_READ_TOKEN;
    if (!tmdbKey && !tmdbReadToken) {
      obs.finish(500, { error_code: 'missing_api_key' });
      return sendApiError(res, 500, 'missing_api_key', 'TMDB credentials not configured');
    }

    // Always fetch page 1 so we can pick the hero regardless of current page
    const [page1Data, pageNData] = await Promise.all([
      tmdbSearchMulti(tmdbKey, tmdbReadToken, q, 1),
      page > 1 ? tmdbSearchMulti(tmdbKey, tmdbReadToken, q, page) : null,
    ]);

    const page1Results: any[] = Array.isArray(page1Data?.results) ? page1Data.results : [];
    const pageNResults: any[] = pageNData
      ? (Array.isArray(pageNData?.results) ? pageNData.results : [])
      : page1Results;

    const totalPages = page1Data?.total_pages ?? 1;
    const totalResults = page1Data?.total_results ?? 0;

    // --- Separate people from titles on page 1 ---
    const page1MappedTitles = page1Results
      .map(mapTmdbToSearchResult)
      .filter((r): r is NonNullable<ReturnType<typeof mapTmdbToSearchResult>> => Boolean(r));

    const pageNMappedTitles = pageNResults
      .map(mapTmdbToSearchResult)
      .filter((r): r is NonNullable<ReturnType<typeof mapTmdbToSearchResult>> => Boolean(r));

    const filteredPage1Titles = applyTitleFilters(page1MappedTitles, {
      mediaTypeFilter,
      genreFilters,
      ratingMin,
      yearMin,
      yearMax
    });

    let results = applyTitleFilters(pageNMappedTitles, {
      mediaTypeFilter,
      genreFilters,
      ratingMin,
      yearMin,
      yearMax
    });

    // --- Select hero: best filtered title from page 1 with a backdrop ---
    const hero = filteredPage1Titles.find((item) => Boolean(item.backdrop_url))
      || filteredPage1Titles[0]
      || null;

    // Sort results
    if (sortBy === 'vote_average.desc') {
      results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'release_date.desc') {
      results.sort((a, b) => parseInt(b.year || '0', 10) - parseInt(a.year || '0', 10));
    } else if (sortBy === 'title.asc') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default: popularity.desc (TMDB order)
      results.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }

    // Limit per page
    results = results.slice(0, MAX_RESULTS_PER_PAGE);

    // --- People (always from page 1) ---
    const people = page1Results
      .filter((item) => item?.media_type === 'person')
      .map(mapTmdbToPerson)
      .filter((p): p is NonNullable<ReturnType<typeof mapTmdbToPerson>> => Boolean(p))
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 8);

    const didYouMean = buildDidYouMean(q, page1MappedTitles);

    const payload = {
      ok: true,
      query: q,
      page,
      total_pages: Math.min(totalPages, 20), // Cap at 20 pages
      total_results: totalResults,
      hero,
      results,
      people,
      did_you_mean: didYouMean,
      applied_filters: {
        type: mediaTypeFilter,
        sortBy,
        genres: genreFilters,
        yearMin,
        yearMax,
        ratingMin
      }
    };

    await setCache(cacheKey, payload, SEARCH_CACHE_TTL_SECONDS);
    obs.finish(200, { cached: false, total: totalResults });
    return res.status(200).json(payload);
  } catch (error: any) {
    obs.log('search_failed', 'error', { error: error?.message || 'Search request failed' });
    obs.finish(500, { error_code: 'search_failed' });
    return sendApiError(res, 500, 'search_failed', 'Search request failed');
  }
}
