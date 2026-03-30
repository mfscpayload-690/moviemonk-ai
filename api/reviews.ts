/**
 * TMDB Reviews proxy — fetches real user reviews for a movie or TV show.
 * Uses existing TMDB credentials, no extra API key needed.
 */
import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w92';

async function tmdbFetch(path: string): Promise<any> {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY    = process.env.TMDB_API_KEY;

  const url = new URL(`${TMDB_BASE}/${path}`);
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);

  const headers: Record<string, string> = TMDB_READ_TOKEN
    ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` }
    : {};

  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB reviews fetch failed: ${r.status}`);
  return r.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    return res.status(403).json({ error: 'forbidden_origin' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const id   = req.query.id  as string | undefined;
  const type = req.query.type as string | undefined;

  if (!id || !type || !['movie', 'tv'].includes(type)) {
    return res.status(400).json({ error: 'missing_or_invalid_params', hint: 'Provide ?id=<tmdb_id>&type=movie|tv' });
  }

  // Sanitise id to digits only
  const safeId = String(id).replace(/\D/g, '');
  if (!safeId) return res.status(400).json({ error: 'invalid_id' });

  try {
    const data = await tmdbFetch(`${type}/${safeId}/reviews?language=en-US&page=1`);
    const raw: any[] = Array.isArray(data.results) ? data.results : [];

    const reviews = raw
      .filter(r => r.content && r.content.trim().length > 40) // skip extremely short "reviews"
      .slice(0, 6)
      .map(r => ({
        id:         r.id,
        author:     r.author || 'Anonymous',
        avatar_url: r.author_details?.avatar_path
          ? r.author_details.avatar_path.startsWith('/')
            ? `${TMDB_IMG}${r.author_details.avatar_path}`
            : r.author_details.avatar_path      // sometimes an external Gravatar URL
          : null,
        rating:     r.author_details?.rating ?? null,   // 0-10
        content:    r.content.trim(),
        url:        r.url || null,
        created_at: r.created_at || null,
      }));

    // Cache for 6 hours on CDN, 12 hours stale
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
    return res.status(200).json({ ok: true, total: data.total_results ?? raw.length, reviews });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
