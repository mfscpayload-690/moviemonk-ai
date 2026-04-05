import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { getCache, setCache, withCacheKey } from '../lib/cache';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdb(path: string, params: Record<string, string | number | undefined>): Promise<any> {
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const url = new URL(`${TMDB_BASE}/${path}`);
  
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  
  if (TMDB_API_KEY) url.searchParams.set('api_key', TMDB_API_KEY);
  
  const headers: Record<string, string> = TMDB_READ_TOKEN 
    ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` } 
    : {};
  
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`TMDB ${path} failed ${r.status}`);
  return (await r.json()) as any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');
  
  if (req.headers.origin && !originAllowed) {
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!['GET', 'POST'].includes(req.method || '')) {
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  try {
    const body = req.method === 'POST' ? (req.body || {}) : {};
    const mediaType = (req.query.type as string) || body.type || 'movie'; // 'movie' or 'tv'
    const q = (req.query.q as string) || body.q || '';
    const page = parseInt(req.query.page as string || body.page) || 1;
    
    // Extract filters
    const genres = body.genres || req.query.genres ? String(req.query.genres || body.genres).split(',').filter(Boolean) : undefined;
    const yearMin = parseInt(req.query.yearMin as string || body.yearMin) || undefined;
    const yearMax = parseInt(req.query.yearMax as string || body.yearMax) || undefined;
    const ratingMin = parseFloat(req.query.ratingMin as string || body.ratingMin) || undefined;
    const languages = body.languages || req.query.languages ? String(req.query.languages || body.languages).split(',').filter(Boolean) : undefined;
    const sortBy = (req.query.sortBy as string || body.sortBy) || 'popularity.desc';
    const runtimeMin = parseInt(req.query.runtimeMin as string || body.runtimeMin) || undefined;
    const runtimeMax = parseInt(req.query.runtimeMax as string || body.runtimeMax) || undefined;

    // Build cache key including filters
    const cacheKey = withCacheKey('filteredSearch', {
      type: mediaType,
      q: q.toLowerCase(),
      genres: genres?.join('|'),
      yearMin,
      yearMax,
      ratingMin,
      languages: languages?.join('|'),
      sortBy,
      page
    });

    // Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }

    // Determine endpoint based on media type
    const isTV = mediaType === 'tv';
    const endpoint = isTV ? 'discover/tv' : 'discover/movie';

    // Build query parameters
    const params: Record<string, any> = {
      page,
      sort_by: sortBy,
      include_adult: false,
      language: 'en-US'
    };

    // Add search query if provided (use multi_search if searching by title)
    if (q.trim()) {
      params.query = q;
      // Search endpoint instead of discover for text queries
      const searchEndpoint = `search/${isTV ? 'tv' : 'movie'}`;
      try {
        const searchData = await tmdb(searchEndpoint, {
          query: q,
          page,
          language: 'en-US',
          include_adult: false
        });

        // Apply additional filters to search results
        const filtered = searchData.results
          .filter((item: any) => {
            // Year filter
            const releaseDate = item.release_date || item.first_air_date || '';
            const resultYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : null;
            if (yearMin && resultYear && resultYear < yearMin) return false;
            if (yearMax && resultYear && resultYear > yearMax) return false;

            // Rating filter
            if (ratingMin && (item.vote_average || 0) < ratingMin) return false;

            // Language filter
            if (languages && !languages.includes(item.original_language)) return false;

            // Genre filter
            if (genres && genres.length > 0) {
              const itemGenres = item.genre_ids || [];
              const hasGenre = genres.some(g => itemGenres.includes(parseInt(g)));
              if (!hasGenre) return false;
            }

            return true;
          })
          .slice(0, 20); // Limit results

        const response = {
          ok: true,
          type: mediaType,
          results: filtered,
          total_results: filtered.length,
          total_pages: 1,
          page,
          cached: false
        };

        await setCache(cacheKey, response, 60 * 30); // Cache for 30 minutes
        return res.status(200).json(response);
      } catch (searchErr) {
        console.warn('Search failed, falling back to discover:', searchErr);
      }
    }

    // Add filter parameters
    if (genres && genres.length > 0) {
      params.with_genres = genres.join('|');
    }

    if (yearMin || yearMax) {
      if (isTV) {
        if (yearMin) params['first_air_date.gte'] = `${yearMin}-01-01`;
        if (yearMax) params['first_air_date.lte'] = `${yearMax}-12-31`;
      } else {
        if (yearMin) params['release_date.gte'] = `${yearMin}-01-01`;
        if (yearMax) params['release_date.lte'] = `${yearMax}-12-31`;
      }
    }

    if (ratingMin !== undefined) {
      params['vote_average.gte'] = ratingMin;
    }

    if (languages && languages.length > 0) {
      params.with_original_language = languages.join('|');
    }

    if (runtimeMin || runtimeMax) {
      if (!isTV) { // Runtime only applies to movies
        const runtimeRange = [];
        if (runtimeMin) runtimeRange.push(`${runtimeMin},9999`);
        if (runtimeMax && !runtimeMin) runtimeRange.push(`0,${runtimeMax}`);
        if (runtimeMin && runtimeMax) runtimeRange[0] = `${runtimeMin},${runtimeMax}`;
        if (runtimeRange.length > 0) params['with_runtime.gte'] = runtimeMin || 0;
        if (runtimeRange.length > 0) params['with_runtime.lte'] = runtimeMax || 999;
      }
    }

    // Execute TMDB discover query
    const data = await tmdb(endpoint, params);

    const response = {
      ok: true,
      type: mediaType,
      results: (data.results || []).map((item: any) => ({
        id: item.id,
        tmdb_id: item.id,
        title: item.title || item.name,
        year: item.release_date ? item.release_date.slice(0, 4) : item.first_air_date?.slice(0, 4) || '',
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
        backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
        rating: item.vote_average || 0,
        genres: item.genre_ids || [],
        media_type: isTV ? 'tv' : 'movie',
        overview: item.overview || ''
      })),
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 1,
      page: data.page || page,
      cached: false
    };

    await setCache(cacheKey, response, 60 * 30); // Cache for 30 minutes
    return res.status(200).json(response);
  } catch (error) {
    console.error('Filter search error:', error);
    return sendApiError(res, 500, 'server_error', 'Failed to filter search results');
  }
}
