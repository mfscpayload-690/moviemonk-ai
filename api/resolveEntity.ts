import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';

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

async function tmdb(path: string, params: Record<string, string | number | undefined>) {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const url = new URL(`${TMDB_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  const headers: Record<string, string> = TMDB_READ_TOKEN ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` } : {};
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB ${path} failed ${r.status}`);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

  const q = (req.query.q as string) || '';
  if (!q.trim()) return res.status(400).json({ error: 'Missing q' });

  const cacheKey = withCacheKey('resolveEntity', { q: q.trim().toLowerCase() });
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const [movieRes, personRes] = (await Promise.all([
      tmdb('search/movie', { query: q, include_adult: 'false', language: 'en-US', page: 1 }),
      tmdb('search/person', { query: q, include_adult: 'false', language: 'en-US', page: 1 }),
    ])) as any[];

    type Candidate = { id: number; name: string; type: 'movie' | 'person'; score: number; extra?: any };
    const candidates: Candidate[] = [];

    for (const m of (movieRes as any).results || []) {
      const title = m.title || m.original_title;
      if (!title) continue;
      const s = similarity(title, q);
      const yearMatch = q.match(/\b(19|20)\d{2}\b/);
      const yearBoost = yearMatch && m.release_date?.startsWith(yearMatch[0]) ? 0.2 : 0;
      const popularity = (m.popularity || 0) / 100; // normalize approx
      const score = s * 0.6 + popularity * 0.3 + yearBoost;
      candidates.push({ id: m.id, name: title, type: 'movie', score, extra: { release_date: m.release_date } });
    }

    for (const p of (personRes as any).results || []) {
      const name = p.name;
      const s = similarity(name, q);
      const popularity = (p.popularity || 0) / 100;
      const score = s * 0.7 + popularity * 0.3;
      candidates.push({ id: p.id, name, type: 'person', score });
    }

    candidates.sort((a, b) => b.score - a.score);

    let type: 'movie' | 'person' | 'ambiguous' | 'none' = 'none';
    let chosen: { id: number; name: string; type: 'movie' | 'person' } | undefined;

    if (candidates.length > 0) {
      const top = candidates[0];
      const second = candidates[1];
      // Confidence threshold: top must be significantly better than second, or very high absolute score
      const confident = top.score >= 0.8 || (second ? top.score - second.score >= 0.15 : top.score >= 0.6);
      if (confident) {
        type = top.type;
        chosen = { id: top.id, name: top.name, type: top.type };
      } else {
        type = 'ambiguous';
      }
    }

    const response = {
      ok: true,
      type,
      query: q,
      candidates: candidates.slice(0, 10).map((c) => ({ id: c.id, name: c.name, type: c.type, score: Number(c.score.toFixed(3)) })),
      chosen,
      cached: false,
    };

    await setCache(cacheKey, response, 60 * 60); // 1 hour
    return res.status(200).json(response);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
