import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import type { VibeParseResult } from '../types';

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

const GENRE_ID_BY_NAME: Record<string, number> = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
  acc[name.toLowerCase()] = Number(id);
  return acc;
}, {} as Record<string, number>);

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic'
};

const VIBE_RECENT_SIGNAL = /\b(recent|latest|newest|new|fresh|current|recently released|just released)\b/i;
const VIBE_HIGH_RATING_SIGNAL = /\b(strong ratings|highly rated|top rated|best rated|well rated|critically acclaimed|acclaimed|award[- ]winning|must[- ]watch)\b/i;

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
  vibe_score?: number;
  match_reasons?: string[];
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

function toStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function normalizeVibeInput(raw: unknown): VibeParseResult | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as VibeParseResult;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    return raw as VibeParseResult;
  }
  return null;
}

function buildEffectiveQuery(rawQuery: string, vibe: VibeParseResult | null): string {
  if (!vibe) return rawQuery.trim();

  const parts = [
    ...toStringArray(vibe.fallback_query_terms),
    ...toStringArray(vibe.hard_constraints.include_people),
    ...toStringArray(vibe.soft_preferences.reference_titles)
  ]
    .map((part) => part.trim())
    .filter(Boolean);

  const deduped = Array.from(new Set(parts.map((part) => part.toLowerCase()))).map((lowerPart) => {
    return parts.find((part) => part.toLowerCase() === lowerPart) || lowerPart;
  });

  const joined = deduped.join(' ').trim();
  return joined || rawQuery.trim();
}

function mapGenreNamesToIds(names: unknown): number[] {
  return toStringArray(names)
    .flatMap((name) => {
      const normalized = name.toLowerCase();
      const exactId = GENRE_ID_BY_NAME[normalized];
      if (exactId) return [exactId];

      if (normalized === 'science fiction' || normalized === 'sci fi' || normalized === 'scifi') {
        return [878];
      }
      if (normalized === 'romcom') {
        return [10749, 35];
      }
      if (normalized === 'suspense') {
        return [53];
      }
      if (normalized === 'kids' || normalized === 'family-friendly') {
        return [10751];
      }
      return [];
    })
    .filter((id): id is number => Number.isInteger(id) && id > 0);
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

type VibeSearchContext = {
  searchMode: 'keyword' | 'vibe' | 'mixed';
  summary: string;
  signals: string[];
  recentSignal: boolean;
  highRatingSignal: boolean;
  derivedYearMin: number | null;
  derivedRatingMin: number | null;
};

function buildVibeSearchContext(query: string, vibe: VibeParseResult | null, ratingMin: number | null): VibeSearchContext {
  const vibeQuery = (vibe?.query_raw || query || '').trim();
  const recentSignal = VIBE_RECENT_SIGNAL.test(vibeQuery);
  const highRatingSignal = VIBE_HIGH_RATING_SIGNAL.test(vibeQuery);
  const derivedYearMin = vibe?.hard_constraints?.release_year_min ?? (recentSignal ? new Date().getFullYear() - 5 : null);
  const derivedRatingMin = ratingMin ?? (highRatingSignal ? 7 : null);

  const signals: string[] = [];
  const includeGenres = toStringArray(vibe?.hard_constraints?.include_genres).slice(0, 3);
  const toneTags = toStringArray(vibe?.soft_preferences?.tone_tags).slice(0, 3);
  const storyCues = toStringArray(vibe?.soft_preferences?.story_cues).slice(0, 2);
  const referenceTitles = toStringArray(vibe?.soft_preferences?.reference_titles).slice(0, 2).map((title) => `like ${title}`);
  const includePeople = toStringArray(vibe?.hard_constraints?.include_people).slice(0, 2).map((name) => `with ${name}`);

  signals.push(...includeGenres);
  signals.push(...toneTags);
  signals.push(...storyCues);
  signals.push(...referenceTitles);
  signals.push(...includePeople);

  if (recentSignal) signals.push('recent');
  if (highRatingSignal) signals.push('high-rated');
  if (derivedYearMin !== null) signals.push(`since ${derivedYearMin}`);

  const summaryParts = [
    ...includeGenres,
    ...toneTags.slice(0, 2),
    ...storyCues.slice(0, 1),
    ...referenceTitles.slice(0, 1),
    ...(recentSignal ? ['recent'] : []),
    ...(highRatingSignal ? ['high-rated'] : [])
  ].filter(Boolean);

  const searchMode: VibeSearchContext['searchMode'] = vibe
    ? (vibe.intent_type === 'mixed' ? 'mixed' : vibe.intent_type === 'vibe_discovery' ? 'vibe' : 'keyword')
    : 'keyword';

  return {
    searchMode,
    summary: summaryParts.length > 0 ? summaryParts.join(' • ') : 'Curated picks',
    signals: Array.from(new Set(signals.filter(Boolean))),
    recentSignal,
    highRatingSignal,
    derivedYearMin,
    derivedRatingMin
  };
}

function buildLanguageLabel(languageCode?: string): string | null {
  if (!languageCode) return null;
  const normalized = languageCode.toLowerCase();
  return LANGUAGE_LABELS[normalized] || normalized.toUpperCase();
}

function buildVibeReasons(item: SearchResultRecord, vibe: VibeParseResult | null, context: VibeSearchContext): string[] {
  const reasons: string[] = [];
  const itemGenreNames = (item.genre_ids || [])
    .map((genreId) => GENRE_MAP[genreId])
    .filter(Boolean)
    .map((genre) => genre.toLowerCase());
  const includeGenres = toStringArray(vibe?.hard_constraints?.include_genres).map((genre) => genre.toLowerCase());
  const matchedGenres = includeGenres.filter((genre) => itemGenreNames.some((itemGenre) => itemGenre === genre || itemGenre.includes(genre) || genre.includes(itemGenre)));

  matchedGenres.slice(0, 2).forEach((genre) => {
    const label = GENRE_ID_BY_NAME[genre] ? GENRE_MAP[GENRE_ID_BY_NAME[genre]] : genre;
    reasons.push(label || genre);
  });

  if (context.recentSignal && item.year) {
    const year = Number(item.year);
    if (Number.isFinite(year) && year >= (context.derivedYearMin ?? year)) {
      reasons.push('Recent');
    }
  }

  if (context.highRatingSignal && typeof item.rating === 'number' && item.rating >= (context.derivedRatingMin ?? 7)) {
    reasons.push(`Rated ${item.rating.toFixed(1)}`);
  }

  const itemLanguageLabel = buildLanguageLabel(item.original_language);
  if (itemLanguageLabel && toStringArray(vibe?.hard_constraints?.languages).some((language) => language.toLowerCase() === String(item.original_language || '').toLowerCase())) {
    reasons.push(itemLanguageLabel);
  }

  const overview = normalizeRepeatedLetters((item.overview || '').toLowerCase());
  for (const cue of toStringArray(vibe?.soft_preferences?.tone_tags).slice(0, 3)) {
    const normalizedCue = normalizeRepeatedLetters(cue.toLowerCase());
    if (normalizedCue && (overview.includes(normalizedCue) || item.title.toLowerCase().includes(normalizedCue))) {
      reasons.push(cue);
    }
  }

  for (const cue of toStringArray(vibe?.soft_preferences?.story_cues).slice(0, 2)) {
    const normalizedCue = normalizeRepeatedLetters(cue.toLowerCase());
    if (normalizedCue && (overview.includes(normalizedCue) || item.title.toLowerCase().includes(normalizedCue))) {
      reasons.push(cue);
    }
  }

  if (reasons.length === 0 && context.searchMode === 'vibe') {
    reasons.push('Vibe match');
  }

  return Array.from(new Set(reasons)).slice(0, 4);
}

function scoreVibeResult(item: SearchResultRecord, vibe: VibeParseResult | null, context: VibeSearchContext): number {
  const reasons = buildVibeReasons(item, vibe, context);
  let score = 35;

  if (reasons.some((reason) => toStringArray(vibe?.hard_constraints?.include_genres).some((genre) => reason.toLowerCase() === genre.toLowerCase()))) {
    score += 30;
  }

  if (reasons.includes('Recent')) {
    score += 15;
  }

  if (reasons.some((reason) => /^Rated\s/i.test(reason))) {
    score += 15;
  }

  if (reasons.some((reason) => buildLanguageLabel(item.original_language) === reason)) {
    score += 10;
  }

  if (reasons.some((reason) => toStringArray(vibe?.soft_preferences?.tone_tags).some((cue) => cue.toLowerCase() === reason.toLowerCase())) ||
      reasons.some((reason) => toStringArray(vibe?.soft_preferences?.story_cues).some((cue) => cue.toLowerCase() === reason.toLowerCase()))) {
    score += 12;
  }

  if (typeof item.rating === 'number') {
    score += Math.min(15, Math.max(0, item.rating - 5) * 4);
  }

  if (typeof item.popularity === 'number') {
    score += Math.min(10, item.popularity / 50);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function decorateVibeResults(items: SearchResultRecord[], vibe: VibeParseResult | null, context: VibeSearchContext): SearchResultRecord[] {
  return items
    .map((item) => {
      const matchReasons = buildVibeReasons(item, vibe, context);
      const vibeScore = scoreVibeResult(item, vibe, context);

      return {
        ...item,
        match_reasons: matchReasons,
        vibe_score: vibeScore
      };
    })
    .sort((a, b) => {
      const vibeDiff = (b.vibe_score ?? 0) - (a.vibe_score ?? 0);
      if (vibeDiff !== 0) return vibeDiff;
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    });
}

async function tmdbSearchPerson(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  query: string
): Promise<any> {
  const url = new URL(`${TMDB_BASE}/search/person`);
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');

  if (tmdbApiKey) {
    url.searchParams.set('api_key', tmdbApiKey);
  }

  const headers: Record<string, string> = tmdbReadToken
    ? { Authorization: `Bearer ${tmdbReadToken}` }
    : {};

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB person search failed: ${response.status}`);
  }
  return response.json();
}

async function resolvePersonIds(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  names: string[]
): Promise<number[]> {
  const uniqueNames = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
  if (uniqueNames.length === 0) return [];

  const lookups = await Promise.all(uniqueNames.map(async (name) => {
    try {
      const data = await tmdbSearchPerson(tmdbApiKey, tmdbReadToken, name);
      const hit = Array.isArray(data?.results)
        ? data.results.find((person: any) => person?.id && typeof person.id === 'number')
        : null;
      return typeof hit?.id === 'number' ? hit.id : null;
    } catch {
      return null;
    }
  }));

  return Array.from(new Set(lookups.filter((id): id is number => typeof id === 'number' && Number.isFinite(id))));
}

async function tmdbDiscover(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  path: '/discover/movie' | '/discover/tv',
  params: Record<string, string | number | undefined>
): Promise<any> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('include_adult', 'false');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  if (tmdbApiKey) {
    url.searchParams.set('api_key', tmdbApiKey);
  }

  const headers: Record<string, string> = tmdbReadToken
    ? { Authorization: `Bearer ${tmdbReadToken}` }
    : {};

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB discover failed: ${response.status}`);
  }
  return response.json();
}

async function fetchVibeDiscoveryCandidates(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  vibe: VibeParseResult,
  context: VibeSearchContext,
  mediaTypeFilter: MediaTypeFilter,
  page: number
): Promise<{ items: SearchResultRecord[]; totalPages: number; totalResults: number }> {
  const includeGenreIds = mapGenreNamesToIds(vibe?.hard_constraints?.include_genres);
  const excludeGenreIds = mapGenreNamesToIds(vibe?.hard_constraints?.exclude_genres);
  const includePeopleIds = await resolvePersonIds(tmdbApiKey, tmdbReadToken, toStringArray(vibe?.hard_constraints?.include_people));
  const sortBy = context.highRatingSignal || context.derivedRatingMin !== null ? 'vote_average.desc' : 'popularity.desc';

  const buildParams = (type: 'movie' | 'tv') => {
    const params: Record<string, string | number | undefined> = {
      language: 'en-US',
      sort_by: sortBy,
      page,
      'vote_count.gte': context.highRatingSignal ? 50 : undefined,
      'vote_average.gte': context.derivedRatingMin ?? undefined
    };

    if (includeGenreIds.length > 0) {
      params.with_genres = includeGenreIds.join(',');
    }
    if (excludeGenreIds.length > 0) {
      params.without_genres = excludeGenreIds.join(',');
    }
    if (context.derivedYearMin !== null) {
      params[type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${context.derivedYearMin}-01-01`;
    }
    if (vibe?.hard_constraints?.release_year_max !== null && vibe?.hard_constraints?.release_year_max !== undefined) {
      params[type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${vibe.hard_constraints.release_year_max}-12-31`;
    }
    if (vibe?.hard_constraints?.languages && vibe.hard_constraints.languages.length === 1) {
      params.with_original_language = vibe.hard_constraints.languages[0];
    }
    if (includePeopleIds.length > 0) {
      params.with_people = includePeopleIds.join(',');
    }

    return params;
  };

  const discoverRequests: Array<Promise<any>> = [];
  if (mediaTypeFilter === 'movie' || mediaTypeFilter === 'all') {
    discoverRequests.push(
      tmdbDiscover(tmdbApiKey, tmdbReadToken, '/discover/movie', buildParams('movie'))
        .then(res => ({
          ...res,
          results: (res.results || []).map((item: any) => ({ ...item, media_type: 'movie' }))
        }))
    );
  }
  if (mediaTypeFilter === 'tv' || mediaTypeFilter === 'all') {
    discoverRequests.push(
      tmdbDiscover(tmdbApiKey, tmdbReadToken, '/discover/tv', buildParams('tv'))
        .then(res => ({
          ...res,
          results: (res.results || []).map((item: any) => ({ ...item, media_type: 'tv' }))
        }))
    );
  }

  const responses = await Promise.all(discoverRequests);
  const items = responses
    .flatMap((response) => Array.isArray(response?.results) ? response.results : [])
    .map(mapTmdbToSearchResult)
    .filter((item): item is SearchResultRecord => Boolean(item));

  return {
    items,
    totalPages: Math.max(1, ...responses.map((response) => Number(response?.total_pages) || 1)),
    totalResults: responses.reduce((sum, response) => sum + (Number(response?.total_results) || 0), 0)
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

function buildRelaxedQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  // Person-role phrasing often hurts TMDB recall (e.g., "chris hemsworth as thor").
  const roleStripped = trimmed.replace(/\bas\s+[^,.;!?]+$/i, '').trim();
  if (roleStripped.length >= 2 && roleStripped !== trimmed) {
    return roleStripped;
  }

  const tokenStripped = trimmed
    .replace(/\b(actor|actress|as|character|playing|portraying|director|starring)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (tokenStripped.length >= 2 && tokenStripped !== trimmed) {
    return tokenStripped;
  }

  return trimmed;
}

function normalizeRepeatedLetters(value: string): string {
  return value.replace(/([a-zA-Z])\1{2,}/g, '$1');
}

function buildQueryCandidates(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const roleStripped = buildRelaxedQuery(trimmed);
  const tokenStripped = trimmed
    .replace(/\b(actor|actress|as|character|playing|portraying|director|starring)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const typoNormalized = normalizeRepeatedLetters(roleStripped || trimmed).trim();
  const tokenTypoNormalized = normalizeRepeatedLetters(tokenStripped || trimmed).trim();

  const surnameCandidate = roleStripped
    .split(/\s+/)
    .filter(Boolean)
    .slice(-1)[0];

  return Array.from(new Set([
    trimmed,
    roleStripped,
    tokenStripped,
    typoNormalized,
    tokenTypoNormalized,
    surnameCandidate,
  ].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()))));
}

async function tmdbSearchWithFallback(
  tmdbApiKey: string | undefined,
  tmdbReadToken: string | undefined,
  originalQuery: string,
  page: number
): Promise<{ data: any; usedQuery: string }> {
  const primary = originalQuery.trim();
  const queryCandidates = buildQueryCandidates(primary);

  let firstResponse: any = null;
  for (const candidate of queryCandidates) {
    const result = await tmdbSearchMulti(tmdbApiKey, tmdbReadToken, candidate, page);
    if (!firstResponse) firstResponse = result;
    const hasResults = Array.isArray(result?.results) && result.results.length > 0;
    if (hasResults) {
      return { data: result, usedQuery: candidate };
    }
  }

  return { data: firstResponse || { results: [], total_pages: 0, total_results: 0 }, usedQuery: primary };
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
  const baseMediaTypeFilter = normalizeMediaTypeFilter(String(input.type || 'all'));
  const sortBy = String(input.sortBy || 'popularity.desc');
  const baseGenreFilters = parseGenreFilters(input.genres ?? input.genre);
  const ratingMin = parseNumber(input.ratingMin);
  const yearMinRaw = parseNumber(input.yearMin);
  const yearMaxRaw = parseNumber(input.yearMax);
  const exactYear = parseNumber(input.year);
  const vibe = normalizeVibeInput((input as any).vibe);
  const vibeContext = buildVibeSearchContext(q, vibe, ratingMin);
  const vibeGenres = mapGenreNamesToIds(vibe?.hard_constraints?.include_genres);
  const vibeExcludedGenres = new Set(toStringArray(vibe?.hard_constraints?.exclude_genres).map((value) => value.toLowerCase()));
  const vibeLanguages = new Set(toStringArray(vibe?.hard_constraints?.languages).map((value) => value.toLowerCase()));
  const vibeYearMin = vibe?.hard_constraints?.release_year_min ?? null;
  const vibeYearMax = vibe?.hard_constraints?.release_year_max ?? null;
  const yearMin = exactYear ?? yearMinRaw ?? vibeYearMin;
  const yearMax = exactYear ?? yearMaxRaw ?? vibeYearMax;
  const effectiveQuery = buildEffectiveQuery(q, vibe);
  const genreFilters = Array.from(new Set([...baseGenreFilters, ...vibeGenres]));
  const mediaTypeFilter = normalizeMediaTypeFilter(String(input.type || vibe?.hard_constraints?.media_type || baseMediaTypeFilter));

  try {
    const cacheKey = withCacheKey('search_v3', {
      q: effectiveQuery.toLowerCase(),
      page,
      type: mediaTypeFilter,
      sortBy,
      genres: genreFilters.join(','),
      yearMin: yearMin ?? '',
      yearMax: yearMax ?? '',
      ratingMin: ratingMin ?? '',
      languages: Array.from(vibeLanguages).join(','),
      excludedGenres: Array.from(vibeExcludedGenres).join(','),
      vibeIntent: vibe?.intent_type ?? '',
      vibeQuery: vibe?.query_raw?.toLowerCase() ?? ''
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

    // Always fetch page 1 first and relax query if strict phrase returns zero results.
    const page1Search = await tmdbSearchWithFallback(tmdbKey, tmdbReadToken, effectiveQuery, 1);
    const page1Data = page1Search.data;
    const pageNData = page > 1
      ? await tmdbSearchWithFallback(tmdbKey, tmdbReadToken, page1Search.usedQuery, page)
      : null;

    const page1Results: any[] = Array.isArray(page1Data?.results) ? page1Data.results : [];
    const pageNResults: any[] = pageNData
      ? (Array.isArray(pageNData?.data?.results) ? pageNData.data.results : [])
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

    const hasSemanticVibeSignals = Boolean(vibe && (
      (vibe?.hard_constraints?.include_genres?.length || 0) > 0
      || (vibe?.hard_constraints?.exclude_genres?.length || 0) > 0
      || (vibe?.hard_constraints?.languages?.length || 0) > 0
      || (vibe?.hard_constraints?.include_people?.length || 0) > 0
      || (vibe?.soft_preferences?.tone_tags?.length || 0) > 0
      || (vibe?.soft_preferences?.story_cues?.length || 0) > 0
      || (vibe?.soft_preferences?.reference_titles?.length || 0) > 0
      || vibeContext.recentSignal
      || vibeContext.highRatingSignal
    ));

    const shouldUseVibeDiscovery = Boolean(vibe && (
      vibe.intent_type !== 'title_lookup'
      || (page1MappedTitles.length === 0 && hasSemanticVibeSignals)
    ));
    const discoverySnapshot = shouldUseVibeDiscovery
      ? await fetchVibeDiscoveryCandidates(tmdbKey, tmdbReadToken, vibe!, vibeContext, mediaTypeFilter, page)
      : { items: [], totalPages: 1, totalResults: 0 };

    const combinedResults = Array.from(
      new Map<string, SearchResultRecord>([
        ...pageNMappedTitles,
        ...discoverySnapshot.items
      ].map((item) => [`${item.media_type}:${item.id}`, item])).values()
    );

    let results = applyTitleFilters(combinedResults, {
      mediaTypeFilter,
      genreFilters,
      ratingMin,
      yearMin,
      yearMax
    });

    if (vibeLanguages.size > 0) {
      results = results.filter((item) => {
        const lang = String(item.original_language || '').toLowerCase();
        return vibeLanguages.has(lang);
      });
    }

    if (vibeExcludedGenres.size > 0) {
      results = results.filter((item) => {
        const itemGenres = (item.genres || []).map((genre) => genre.toLowerCase());
        return !itemGenres.some((genre) => vibeExcludedGenres.has(genre));
      });
    }

    const vibeRankingContext = shouldUseVibeDiscovery && vibe
      ? { ...vibeContext, searchMode: vibe.intent_type === 'mixed' ? 'mixed' as const : 'vibe' as const }
      : vibeContext;

    const rankedResults = shouldUseVibeDiscovery
      ? decorateVibeResults(results, vibe, vibeRankingContext)
      : (() => {
          const sortedResults = [...results];
          if (sortBy === 'vote_average.desc') {
            sortedResults.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          } else if (sortBy === 'release_date.desc') {
            sortedResults.sort((a, b) => parseInt(b.year || '0', 10) - parseInt(a.year || '0', 10));
          } else if (sortBy === 'title.asc') {
            sortedResults.sort((a, b) => a.title.localeCompare(b.title));
          } else {
            sortedResults.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
          }
          return sortedResults;
        })();

    const hero = rankedResults.find((item) => Boolean(item.backdrop_url))
      || rankedResults[0]
      || filteredPage1Titles.find((item) => Boolean(item.backdrop_url))
      || filteredPage1Titles[0]
      || null;

    const people = page1Results
      .filter((item) => item?.media_type === 'person')
      .map(mapTmdbToPerson)
      .filter((p): p is NonNullable<ReturnType<typeof mapTmdbToPerson>> => Boolean(p))
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 8);

    const didYouMean = shouldUseVibeDiscovery ? [] : buildDidYouMean(effectiveQuery, page1MappedTitles);
    const searchMode = vibe
      ? (vibe.intent_type === 'mixed' ? 'mixed' : shouldUseVibeDiscovery ? 'vibe' : 'keyword')
      : 'keyword';
    const totalResultCount = shouldUseVibeDiscovery
      ? Math.max(rankedResults.length, discoverySnapshot.totalResults, page1Data?.total_results ?? 0)
      : totalResults;
    const totalPageCount = shouldUseVibeDiscovery
      ? Math.min(20, Math.max(page1Data?.total_pages ?? 1, discoverySnapshot.totalPages))
      : Math.min(totalPages, 20);

    const payload = {
      ok: true,
      query: effectiveQuery,
      page,
      total_pages: totalPageCount,
      total_results: totalResultCount,
      search_mode: searchMode,
      hero,
      results: rankedResults.slice(0, MAX_RESULTS_PER_PAGE),
      people,
      did_you_mean: didYouMean,
      vibe: vibe
        ? {
            intent_type: vibe.intent_type,
            summary: vibeContext.summary,
            signals: vibeContext.signals
          }
        : undefined,
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
    obs.finish(200, { cached: false, total: totalResultCount });
    return res.status(200).json(payload);
  } catch (error: any) {
    obs.log('search_failed', 'error', { error: error?.message || 'Search request failed' });
    obs.finish(500, { error_code: 'search_failed' });
    return sendApiError(res, 500, 'search_failed', 'Search request failed');
  }
}
