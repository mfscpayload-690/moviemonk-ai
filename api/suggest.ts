import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { searchPerplexity } from '../services/perplexityService';
import {
  rankSuggestCandidates,
  SuggestCandidate,
  RankedSuggestCandidate
} from '../services/suggestRanking';

const SUGGEST_CACHE_TTL_SECONDS = 45;
const MAX_SUGGESTIONS = 8;

function mapTmdbItemToCandidate(item: any): SuggestCandidate | null {
  const mediaType = item?.media_type;
  if (!mediaType || !['movie', 'tv', 'person'].includes(mediaType)) return null;

  const title = item.title || item.name;
  if (!title) return null;

  const yearSource = item.release_date || item.first_air_date;
  const year = typeof yearSource === 'string' && yearSource.length >= 4 ? yearSource.slice(0, 4) : undefined;

  return {
    id: item.id,
    title,
    year,
    type: mediaType === 'movie' ? 'movie' : mediaType === 'tv' ? 'show' : 'person',
    media_type: mediaType,
    poster_url: item.poster_path
      ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
      : item.profile_path
        ? `https://image.tmdb.org/t/p/w154${item.profile_path}`
        : undefined,
    popularity: typeof item.popularity === 'number' ? item.popularity : undefined,
    known_for_department: item.known_for_department,
    known_for_titles: Array.isArray(item.known_for)
      ? item.known_for
          .map((entry: any) => entry?.title || entry?.name)
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
      : undefined
  };
}

async function fetchTmdbSuggestions(query: string): Promise<SuggestCandidate[]> {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) {
    throw new Error('TMDB_API_KEY not configured');
  }

  const url = new URL('https://api.themoviedb.org/3/search/multi');
  url.searchParams.set('api_key', tmdbKey);
  url.searchParams.set('query', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('include_adult', 'false');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB suggest request failed: ${response.status}`);
  }

  const data = await response.json();
  const rawResults = Array.isArray(data?.results) ? data.results : [];

  return rawResults
    .slice(0, 20)
    .map(mapTmdbItemToCandidate)
    .filter((candidate): candidate is SuggestCandidate => Boolean(candidate));
}

async function fetchFallbackSuggestions(query: string): Promise<SuggestCandidate[]> {
  const fallback = await searchPerplexity(query, 3);
  return fallback
    .map((item: any, idx: number): SuggestCandidate | null => {
      if (!item?.title) return null;
      return {
        id: item.id || Math.abs(`${query}-${idx}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)),
        title: item.title,
        year: item.year,
        type: 'movie',
        media_type: 'movie',
        poster_url: item.image,
        popularity: 1
      };
    })
    .filter((candidate): candidate is SuggestCandidate => Boolean(candidate));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/suggest');
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    obs.finish(200, { total: 0, reason: 'query_too_short' });
    return res.status(200).json({ ok: true, query: q, total: 0, suggestions: [] });
  }

  try {
    const cacheKey = withCacheKey('suggest_v1', { q: q.toLowerCase() });
    const cached = await getCache(cacheKey);
    if (cached) {
      obs.finish(200, { cached: true, total: cached.total || 0 });
      return res.status(200).json({ ...cached, cached: true });
    }

    const tmdbCandidates = await fetchTmdbSuggestions(q);
    const candidates = tmdbCandidates.length > 0
      ? tmdbCandidates
      : await fetchFallbackSuggestions(q);

    // Fallback source is only used when TMDB yields no candidates.
    const ranked: RankedSuggestCandidate[] = rankSuggestCandidates(q, candidates)
      .slice(0, MAX_SUGGESTIONS);

    const payload = {
      ok: true,
      query: q,
      total: ranked.length,
      suggestions: ranked.map((item) => ({
        id: item.id,
        title: item.title,
        year: item.year,
        type: item.type,
        media_type: item.media_type,
        poster_url: item.poster_url,
        confidence: item.confidence,
        known_for_department: item.type === 'person' ? item.known_for_department : undefined,
        known_for_titles: item.type === 'person' ? item.known_for_titles : undefined
      }))
    };

    await setCache(cacheKey, payload, SUGGEST_CACHE_TTL_SECONDS);
    obs.finish(200, { cached: false, total: payload.total });
    return res.status(200).json(payload);
  } catch (error: any) {
    obs.log('suggest_failed', 'error', { error: error?.message || 'Suggest request failed' });
    obs.finish(500, { error_code: 'suggest_failed' });
    return sendApiError(res, 500, 'suggest_failed', error?.message || 'Suggest request failed');
  }
}
