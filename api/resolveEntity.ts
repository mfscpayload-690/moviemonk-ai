import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { parsePersonIntent, resolveRoleMatch } from '../services/personIntent';
import { PersonSearchCandidate } from '../types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[bn][an];
}

function similarity(a: string, b: string) {
  const na = normalize(a);
  const nb = normalize(b);
  const maxLen = Math.max(na.length, nb.length) || 1;
  const dist = levenshtein(na, nb);
  return 1 - dist / maxLen; // 0..1
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function computeKnownForOverlap(tokens: string[], knownForTitles: string[]): number {
  if (!tokens.length || !knownForTitles.length) return 0;
  const haystack = knownForTitles.join(' ').toLowerCase();
  const matchCount = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
  return Math.min(0.12, matchCount * 0.04);
}

async function tmdb(path: string, params: Record<string, string | number | undefined>) {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  
  // Sanitize path to prevent directory traversal
  const sanitizedPath = path.split('/').filter(seg => seg && !seg.startsWith('.')).join('/');
  const url = new URL(`${TMDB_BASE}/${sanitizedPath}`);
  
  // Only set safe parameter values
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      const strVal = String(v);
      // Validate parameter values don't contain suspicious content
      if (!strVal.includes('\0') && !strVal.includes('\n') && !strVal.includes('\r')) {
        url.searchParams.set(k, strVal);
      }
    }
  }
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  const headers: Record<string, string> = TMDB_READ_TOKEN ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` } : {};
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB ${sanitizedPath} failed ${r.status}`);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/resolveEntity');
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }
  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Only GET supported');
  }

  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Missing q');
  }

  const cacheKey = withCacheKey('resolveEntity', { q: q.trim().toLowerCase() });
  const cached = await getCache(cacheKey);
  if (cached) {
    obs.finish(200, { cached: true });
    return res.status(200).json({ ...cached, cached: true });
  }

  try {
    const intent = parsePersonIntent(q);

    // Detect regional queries and search in original language too
    const regionalMap: Record<string, string> = {
      'malayalam': 'ml',
      'tamil': 'ta',
      'telugu': 'te',
      'kannada': 'kn',
      'hindi': 'hi',
      'bengali': 'bn',
      'marathi': 'mr'
    };
    
    const qLower = q.toLowerCase();
    const regionalLang = Object.keys(regionalMap).find(key => qLower.includes(key));
    const languages = regionalLang ? ['en-US', regionalMap[regionalLang]] : ['en-US'];
    
    // Search in both English and regional language if applicable
    const searches = languages.map(lang => Promise.all([
      tmdb('search/movie', { query: q, include_adult: 'false', language: lang, page: 1 }),
      tmdb('search/person', { query: q, include_adult: 'false', language: lang, page: 1 }),
    ]));
    
    const allResults = await Promise.all(searches);
    
    // Merge results from all language searches
    const movieRes = { results: allResults.flatMap(([movies]: any) => movies.results || []) };
    const personRes = { results: allResults.flatMap(([_, people]: any) => people.results || []) };

    type Candidate = {
      id: number;
      name: string;
      type: 'movie' | 'person';
      score: number;
      popularity?: number;
      profile_url?: string;
      known_for_department?: string;
      known_for_titles?: string[];
      role_match?: 'match' | 'mismatch' | 'neutral';
      extra?: any;
    };
    const candidates: Candidate[] = [];

    for (const m of (movieRes as any).results || []) {
      const title = m.title || m.original_title;
      if (!title) continue;
      const s = similarity(title, q);
      const yearMatch = q.match(/\b(19|20)\d{2}\b/);
      const yearBoost = yearMatch && m.release_date?.startsWith(yearMatch[0]) ? 0.16 : 0;
      const popularity = clamp01((m.popularity || 0) / 100); // normalize approx
      const score = clamp01(s * 0.62 + popularity * 0.28 + yearBoost);
      candidates.push({
        id: m.id,
        name: title,
        type: 'movie',
        score,
        popularity: m.popularity,
        extra: { release_date: m.release_date }
      });
    }

    for (const p of (personRes as any).results || []) {
      const name = p.name;
      if (!name) continue;
      const s = similarity(name, q);
      const popularity = clamp01((p.popularity || 0) / 100);
      const knownForTitles = Array.isArray(p.known_for)
        ? p.known_for
            .map((entry: any) => entry?.title || entry?.name)
            .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
        : [];
      const roleMatch = resolveRoleMatch(intent.requested_role, p.known_for_department);
      const roleBoost = roleMatch === 'match' ? 0.2 : roleMatch === 'mismatch' ? -0.08 : 0;
      const knownForBoost = computeKnownForOverlap(intent.tokens, knownForTitles);
      const personFocusBoost = intent.is_person_focused ? 0.12 : 0;
      const score = clamp01(s * 0.56 + popularity * 0.16 + roleBoost + knownForBoost + personFocusBoost);

      candidates.push({
        id: p.id,
        name,
        type: 'person',
        score,
        popularity: p.popularity,
        profile_url: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : undefined,
        known_for_department: p.known_for_department,
        known_for_titles: knownForTitles,
        role_match: roleMatch
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    let type: 'movie' | 'person' | 'ambiguous' | 'none' = 'none';
    let confidence_band: 'confident' | 'shortlist' | 'none' = 'none';
    let chosen: { id: number; name: string; type: 'movie' | 'person' } | undefined;
    let shortlisted: PersonSearchCandidate[] = [];

    const personCandidates = candidates
      .filter((candidate): candidate is Candidate & { type: 'person' } => candidate.type === 'person')
      .sort((a, b) => b.score - a.score);
    shortlisted = personCandidates.slice(0, 8).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      type: 'person',
      score: Number(candidate.score.toFixed(3)),
      confidence: Number(candidate.score.toFixed(3)),
      popularity: candidate.popularity,
      role_match: candidate.role_match,
      known_for_department: candidate.known_for_department,
      known_for_titles: candidate.known_for_titles,
      profile_url: candidate.profile_url
    }));

    if (candidates.length > 0) {
      const top = candidates[0];
      const second = candidates[1];
      const gap = second ? top.score - second.score : top.score;
      const confident = top.score >= 0.86 || (top.score >= 0.72 && gap >= 0.12);

      if (intent.is_person_focused && shortlisted.length > 0) {
        if (top.type === 'person' && confident) {
          type = 'person';
          confidence_band = 'confident';
          chosen = { id: top.id, name: top.name, type: 'person' };
        } else {
          type = 'ambiguous';
          confidence_band = 'shortlist';
        }
      } else if (confident) {
        type = top.type;
        confidence_band = 'confident';
        chosen = { id: top.id, name: top.name, type: top.type };
      } else {
        type = 'ambiguous';
        confidence_band = top.type === 'person' && shortlisted.length > 0 ? 'shortlist' : 'none';
      }
    }

    const response = {
      ok: true,
      type,
      confidence_band,
      query: q,
      intent: {
        requested_role: intent.requested_role,
        is_person_focused: intent.is_person_focused,
        year: intent.year
      },
      candidates: candidates.slice(0, 10).map((c) => ({ id: c.id, name: c.name, type: c.type, score: Number(c.score.toFixed(3)) })),
      chosen,
      shortlisted,
      cached: false,
    };

    await setCache(cacheKey, response, 60 * 60); // 1 hour
    obs.finish(200, { cached: false, candidates: response.candidates.length, type: response.type });
    return res.status(200).json(response);
  } catch (e: any) {
    obs.log('resolve_entity_failed', 'error', { error: e.message || 'Resolve entity failed' });
    obs.finish(500, { error_code: 'resolve_entity_failed' });
    return sendApiError(res, 500, 'resolve_entity_failed', e.message || 'Resolve entity failed');
  }
}
