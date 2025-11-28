import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../../lib/cache';

const TMDB_BASE = 'https://api.themoviedb.org/3';

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

  const { id } = req.query as { id?: string };
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const cacheKey = withCacheKey('person', { id });
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const [person, credits] = (await Promise.all([
      tmdb(`person/${id}`, { language: 'en-US' }),
      tmdb(`person/${id}/movie_credits`, { language: 'en-US' }),
    ])) as any[];

    const filmographyRaw = [
      ...((credits as any).cast || []).map((c: any) => ({
        id: c.id,
        title: c.title || c.original_title,
        year: c.release_date ? Number(String(c.release_date).slice(0, 4)) : undefined,
        role: 'cast',
        character: c.character,
        poster_url: c.poster_path ? `https://image.tmdb.org/t/p/w342${c.poster_path}` : undefined,
      })),
      ...((credits as any).crew || []).map((c: any) => ({
        id: c.id,
        title: c.title || c.original_title,
        year: c.release_date ? Number(String(c.release_date).slice(0, 4)) : undefined,
        role: c.job || 'crew',
        character: undefined,
        poster_url: c.poster_path ? `https://image.tmdb.org/t/p/w342${c.poster_path}` : undefined,
      })),
    ];

    const filmography = filmographyRaw
      .filter((f) => f.title)
      .sort((a, b) => (b.year || 0) - (a.year || 0));

    const payload = {
      person: {
        id: person.id,
        name: person.name,
        biography: person.biography,
        birthday: person.birthday,
        place_of_birth: person.place_of_birth,
        profile_url: person.profile_path ? `https://image.tmdb.org/t/p/w342${person.profile_path}` : undefined,
      },
      filmography,
      sources: [
        { name: 'TMDB', url: `https://www.themoviedb.org/person/${person.id}` },
      ],
      cached: false,
    };

    await setCache(cacheKey, payload, 60 * 60 * 24); // 24h
    return res.status(200).json(payload);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
