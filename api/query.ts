import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { generateSummary } from '../services/ai';

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

function buildBaseUrl(req: VercelRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host as string;
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.method === 'POST' ? (req.body || {}) : {};
  const q = (req.query.q as string) || body.q || '';
  const mode = ((req.query.mode as string) || body.mode || 'detailed') as 'short' | 'detailed';

  if (!q.trim()) return res.status(400).json({ ok: false, error: 'Missing q' });

  const cacheKey = withCacheKey('hybridQuery', { q: q.trim().toLowerCase(), mode });
  const cached = await getCache(cacheKey);
  if (cached) return res.status(200).json({ ...cached, cached: true });

  try {
    const base = buildBaseUrl(req);
    
    // Detect regional Indian cinema keywords for enhanced search
    const regionalKeywords = ['malayalam', 'tamil', 'telugu', 'kannada', 'hindi', 'bengali', 'marathi', 'gujarati', 'punjabi', 'bollywood', 'kollywood', 'tollywood', 'mollywood', 'sandalwood'];
    const isRegionalQuery = regionalKeywords.some(kw => q.toLowerCase().includes(kw));
    
    // Resolve entity using our resolver endpoint
    const resolvedRes = await fetch(`${base}/api/resolveEntity?q=${encodeURIComponent(q)}`);
    const resolved = await resolvedRes.json();
    
    // If TMDB has low confidence or regional query, enhance with web search
    let webContext = '';
    if (isRegionalQuery || !resolved?.chosen?.id) {
      try {
        const webRes = await fetch(`${base}/api/websearch?q=${encodeURIComponent(q + ' movie actor director')}&sources=wikipedia,imdb`);
        const webData = await webRes.json();
        if (webData.ok && webData.total > 0) {
          // Build context from web results
          const snippets = Object.values(webData.results || {})
            .flat()
            .slice(0, 5)
            .map((r: any) => `${r.title}: ${r.snippet}`)
            .join('\n\n');
          webContext = `\n\nAdditional Web Context:\n${snippets}`;
        }
      } catch (webErr) {
        console.warn('Web search failed:', webErr);
      }
    }

    if (resolved?.type === 'person' && resolved?.chosen?.id) {
      const personRes = await fetch(`${base}/api/person/${resolved.chosen.id}`);
      const personPayload = await personRes.json();

      let summary: any = { summary_short: '', summary_long: '' };
      if (mode === 'short') {
        const bio = (personPayload?.person?.biography || '').trim();
        summary.summary_short = bio ? (bio.length > 280 ? bio.slice(0, 277) + '…' : bio) : `Brief about ${personPayload?.person?.name || 'this person'}.`;
        summary.summary_long = bio || '';
      } else {
        // Build evidence from biography + top filmography + web context
        const bio = (personPayload?.person?.biography || '').slice(0, 1200);
        const films = (personPayload?.filmography || []).slice(0, 8)
          .map((f: any) => `${f.year || '—'} • ${f.title}${f.role ? ` (${f.role}${f.character ? ` as ${f.character}` : ''})` : ''}`)
          .join('\n');
        const evidence = `Biography:\n${bio}\n\nSelected Filmography:\n${films}${webContext}`;

        const schema = { summary_short: 'string', summary_long: 'string' } as const;
        const gen = await generateSummary({ evidence, query: q, schema, timeoutMs: 10000 });
        if (gen.ok) summary = gen.json;
      }

      const response = {
        ok: true,
        type: 'person',
        data: personPayload,
        summary,
        sources: personPayload?.sources || [],
        cached: false
      };
      await setCache(cacheKey, response, 60 * 60);
      return res.status(200).json(response);
    }

    // Movie path: fetch details + credits, summarize
    if (resolved?.type === 'movie' && resolved?.chosen?.id) {
      const id = resolved.chosen.id;
      const [movie, credits] = await Promise.all([
        tmdb(`movie/${id}`, { language: 'en-US' }),
        tmdb(`movie/${id}/credits`, { language: 'en-US' })
      ]);

      const year = movie.release_date ? String(movie.release_date).slice(0,4) : '';
      const genres = Array.isArray(movie.genres) ? movie.genres.map((g: any) => g.name) : [];
      const cast = (credits?.cast || []).slice(0, 12).map((c: any) => ({ name: c.name, role: c.character }));
      const crew = {
        director: (credits?.crew || []).find((c: any) => c.job === 'Director')?.name || '',
        writer: (credits?.crew || []).find((c: any) => c.job === 'Writer' || c.job === 'Screenplay')?.name || '',
        music: (credits?.crew || []).find((c: any) => c.job === 'Original Music Composer' || c.job === 'Composer')?.name || ''
      };

      const data = {
        movie: {
          id: movie.id,
          title: movie.title || movie.original_title,
          year,
          overview: movie.overview || '',
          genres,
          poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
          backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : undefined,
          cast,
          crew
        }
      };

      let summary: any = { summary_short: '', summary_long: '' };
      if (mode === 'short') {
        const short = data.movie.overview || '';
        summary.summary_short = short ? (short.length > 280 ? short.slice(0,277) + '…' : short) : `Brief about ${data.movie.title}.`;
        summary.summary_long = short;
      } else {
        const castLines = cast.slice(0,8).map((c) => `${c.name} as ${c.role || ''}`.trim()).join('\n');
        const evidence = `Title: ${data.movie.title} (${year})\nGenres: ${genres.join(', ')}\n\nOverview:\n${data.movie.overview}\n\nKey Cast:\n${castLines}\n\nCrew:\nDirector: ${crew.director}\nWriter: ${crew.writer}\nMusic: ${crew.music}${webContext}`;
        const schema = { summary_short: 'string', summary_long: 'string' } as const;
        const gen = await generateSummary({ evidence, query: `${data.movie.title} (${year})`, schema, timeoutMs: 10000 });
        if (gen.ok) summary = gen.json;
      }

      const response = {
        ok: true,
        type: 'movie',
        data,
        summary,
        sources: [{ name: 'TMDB', url: `https://www.themoviedb.org/movie/${movie.id}` }],
        cached: false
      };
      await setCache(cacheKey, response, 60 * 60);
      return res.status(200).json(response);
    }

    // Ambiguous or none
    return res.status(200).json({ ok: true, type: resolved?.type || 'none', data: null, summary: { summary_short: '', summary_long: '' }, sources: [], cached: false });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'Unknown error' });
  }
}
