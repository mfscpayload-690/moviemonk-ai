import { MovieData, CastMember, Crew, Rating, WatchOption } from '../types';
import { ParsedQuery } from './queryParser';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Use proxy for TMDB calls (API key stays server-side)
const TMDB_PROXY = import.meta.env.DEV
  ? 'http://localhost:3000/api/tmdb'
  : `${window.location.origin}/api/tmdb`;

// Use proxy for OMDB calls (API key stays server-side)
const OMDB_PROXY = import.meta.env.DEV
  ? 'http://localhost:3000/api/omdb'
  : `${window.location.origin}/api/omdb`;

function buildImageUrl(path: string | null | undefined, size: 'w500'|'w780'|'original' = 'original'): string {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
}

async function tmdbFetch(path: string, params: Record<string, string | number | undefined> = {}): Promise<any> {
  // Build query string for proxy
  const queryParams = new URLSearchParams();
  queryParams.set('endpoint', path.replace(/^\//, '')); // Remove leading slash
  
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      queryParams.set(k, String(v));
    }
  });
  
  const url = `${TMDB_PROXY}?${queryParams.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json();
}

async function searchTitle(title: string, year?: string, type?: MovieData['type']): Promise<{ id: number; mediaType: 'movie'|'tv' } | null> {
  const trimmed = (title || '').trim();
  if (!trimmed) return null;

  const preferTv = type === 'show';

  try {
    // Try specific type first when we know it
    if (preferTv) {
      const tv = await tmdbFetch('/search/tv', { query: trimmed, first_air_date_year: year });
      if (tv?.results?.length) return { id: tv.results[0].id, mediaType: 'tv' };
    } else {
      const mv = await tmdbFetch('/search/movie', { query: trimmed, year });
      if (mv?.results?.length) return { id: mv.results[0].id, mediaType: 'movie' };
    }

    // Fallback to multi
    const multi = await tmdbFetch('/search/multi', { query: trimmed, year });
    const hit = multi?.results?.find((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
    if (hit) return { id: hit.id, mediaType: hit.media_type };
  } catch (e) {
    console.warn('TMDB search error:', e);
  }
  return null;
}

async function fetchImages(mediaType: 'movie'|'tv', id: number): Promise<{ poster?: string; backdrop?: string; gallery: string[] }> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/images`, { include_image_language: 'en,null' });
    const poster = buildImageUrl(data?.posters?.[0]?.file_path, 'w500');
    const backdrop = buildImageUrl(data?.backdrops?.[0]?.file_path, 'w780');

    const galleryPaths: string[] = [];
    (data?.backdrops || []).slice(0, 6).forEach((b: any) => b?.file_path && galleryPaths.push(b.file_path));
    (data?.posters || []).slice(0, 2).forEach((p: any) => p?.file_path && galleryPaths.push(p.file_path));

    const gallery = galleryPaths.map(p => buildImageUrl(p, 'w780')).filter(Boolean).slice(0, 6);
    return { poster, backdrop, gallery };
  } catch (e) {
    console.warn('TMDB images error:', e);
    return { gallery: [] };
  }
}

function isLikelyImageUrl(u: string | undefined | null): boolean {
  if (!u) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(u);
}

/**
 * Fetch cast from TMDB (top 15 actors)
 */
async function fetchCast(mediaType: 'movie'|'tv', id: number): Promise<CastMember[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/credits`);
    const cast: CastMember[] = [];
    
    (data?.cast || []).slice(0, 15).forEach((actor: any) => {
      if (actor.name && actor.character) {
        cast.push({
          name: actor.name,
          role: actor.character,
          known_for: actor.known_for_department || 'Acting'
        });
      }
    });
    
    return cast;
  } catch (e) {
    console.warn('TMDB cast fetch error:', e);
    return [];
  }
}

/**
 * Fetch crew (director, writer, composer) from TMDB
 */
async function fetchCrew(mediaType: 'movie'|'tv', id: number): Promise<Crew> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/credits`);
    const crew = data?.crew || [];
    
    const director = crew.find((c: any) => c.job === 'Director' || c.job === 'Series Director')?.name || '';
    const writer = crew.find((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.department === 'Writing')?.name || '';
    const music = crew.find((c: any) => c.job === 'Original Music Composer' || c.department === 'Sound')?.name || '';
    
    return { director, writer, music };
  } catch (e) {
    console.warn('TMDB crew fetch error:', e);
    return { director: '', writer: '', music: '' };
  }
}

/**
 * Get IMDB ID from TMDB
 */
async function getIMDBId(mediaType: 'movie'|'tv', id: number): Promise<string | null> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/external_ids`);
    return data?.imdb_id || null;
  } catch (e) {
    console.warn('TMDB external IDs fetch error:', e);
    return null;
  }
}

/**
 * Fetch ratings from OMDB API using IMDB ID (via secure proxy)
 */
async function fetchOMDBRatings(imdbId: string): Promise<Rating[]> {
  try {
    const url = `${OMDB_PROXY}?i=${encodeURIComponent(imdbId)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`OMDB proxy error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.Response === 'False') {
      return [];
    }
    
    const ratings: Rating[] = [];
    
    // IMDB Rating
    if (data.imdbRating && data.imdbRating !== 'N/A') {
      ratings.push({
        source: 'IMDb',
        score: `${data.imdbRating}/10`
      });
    }
    
    // Other ratings from Ratings array
    if (data.Ratings && Array.isArray(data.Ratings)) {
      data.Ratings.forEach((r: any) => {
        if (r.Source && r.Value) {
          ratings.push({
            source: r.Source,
            score: r.Value
          });
        }
      });
    }
    
    return ratings;
  } catch (e) {
    console.warn('OMDB ratings fetch error:', e);
    return [];
  }
}

/**
 * Fetch watch providers from TMDB
 */
async function fetchWatchProviders(mediaType: 'movie'|'tv', id: number): Promise<WatchOption[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
    const us = data?.results?.US;
    if (!us) return [];
    
    const providers: WatchOption[] = [];
    
    // Streaming (subscription)
    (us.flatrate || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'subscription'
      });
    });
    
    // Rent
    (us.rent || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'rent'
      });
    });
    
    // Buy
    (us.buy || []).forEach((p: any) => {
      providers.push({
        platform: p.provider_name,
        link: us.link || '',
        type: 'buy'
      });
    });
    
    // Deduplicate by platform name
    const unique = providers.filter((p, i, arr) => 
      arr.findIndex(x => x.platform === p.platform) === i
    );
    
    return unique.slice(0, 8); // Limit to 8 providers
  } catch (e) {
    console.warn('TMDB watch providers error:', e);
    return [];
  }
}

/**
 * Fetch full details from TMDB
 */
async function fetchDetails(mediaType: 'movie'|'tv', id: number): Promise<{
  title: string;
  year: string;
  type: MovieData['type'];
  genres: string[];
  overview: string;
  trailer?: string;
}> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}`);
    
    const title = mediaType === 'movie' ? data.title : data.name;
    const releaseDate = mediaType === 'movie' ? data.release_date : data.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear().toString() : '';
    const genres = (data.genres || []).map((g: any) => g.name);
    const overview = data.overview || '';
    
    // Try to get trailer from videos
    let trailer = '';
    try {
      const videos = await tmdbFetch(`/${mediaType}/${id}/videos`);
      const trailerVideo = videos?.results?.find(
        (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      if (trailerVideo) {
        trailer = `https://www.youtube.com/watch?v=${trailerVideo.key}`;
      }
    } catch (e) {
      console.warn('TMDB trailer fetch error:', e);
    }
    
    return {
      title,
      year,
      type: mediaType === 'tv' ? 'show' : 'movie',
      genres,
      overview,
      trailer
    };
  } catch (e) {
    console.warn('TMDB details fetch error:', e);
    throw e;
  }
}

/**
 * Get comprehensive movie/show data from TMDB (100% factual)
 */
export async function getFromTMDB(parsed: ParsedQuery): Promise<MovieData | null> {
  try {
    // Search for title
    const search = await searchTitle(
      parsed.title,
      parsed.year?.toString(),
      parsed.type === 'auto' ? undefined : parsed.type
    );
    
    if (!search) {
      console.log(`❌ TMDB: No results for "${parsed.title}"`);
      return null;
    }
    
    console.log(`✅ TMDB: Found ${search.mediaType} ID ${search.id} for "${parsed.title}"`);
    
    // Fetch all data in parallel
    const [details, cast, crew, images, watchProviders, imdbId] = await Promise.all([
      fetchDetails(search.mediaType, search.id),
      fetchCast(search.mediaType, search.id),
      fetchCrew(search.mediaType, search.id),
      fetchImages(search.mediaType, search.id),
      fetchWatchProviders(search.mediaType, search.id),
      getIMDBId(search.mediaType, search.id)
    ]);
    
    // Fetch IMDB ratings if we have the ID
    let ratings: Rating[] = [];
    if (imdbId) {
      ratings = await fetchOMDBRatings(imdbId);
      console.log(`✅ OMDB: Fetched ${ratings.length} ratings for ${imdbId}`);
    }
    
    // Build MovieData from TMDB facts (no AI hallucinations!)
    const movieData: MovieData = {
      title: details.title,
      year: details.year,
      type: details.type,
      genres: details.genres,
      poster_url: images.poster || '',
      backdrop_url: images.backdrop || '',
      trailer_url: details.trailer || '',
      ratings,
      cast,
      crew,
      // Summaries will be filled by AI (creative content)
      summary_short: details.overview.substring(0, 200) + (details.overview.length > 200 ? '...' : ''),
      summary_medium: details.overview,
      summary_long_spoilers: '', // AI will provide
      suspense_breaker: '', // AI will provide
      where_to_watch: watchProviders,
      extra_images: images.gallery,
      ai_notes: '' // AI will provide trivia
    };
    
    return movieData;
  } catch (e) {
    console.warn('TMDB full fetch failed:', e);
    return null;
  }
}

/**
 * @deprecated Use getFromTMDB instead for full factual data
 */
export async function enrichWithTMDB(data: MovieData): Promise<MovieData> {
  try {
    const search = await searchTitle(data.title, data.year, data.type);
    if (!search) return data;

    const imgs = await fetchImages(search.mediaType, search.id);

    // Always prefer TMDB images. Only fall back to AI if TMDB has nothing.
    const poster_url = imgs.poster || (isLikelyImageUrl(data.poster_url) ? data.poster_url : '');
    const backdrop_url = imgs.backdrop || (isLikelyImageUrl(data.backdrop_url) ? data.backdrop_url : '');

    const extra_images: string[] = imgs.gallery.length > 0
      ? imgs.gallery
      : (Array.isArray(data.extra_images) ? data.extra_images.filter(isLikelyImageUrl) : []);

    return { ...data, poster_url, backdrop_url, extra_images };
  } catch (e) {
    console.warn('TMDB enrichment failed:', e);
    return data;
  }
}
