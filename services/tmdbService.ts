import { MovieData } from '../types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

function getAuthHeaders(): HeadersInit | undefined {
  const v4 = process.env.TMDB_READ_TOKEN;
  if (v4) {
    return { Authorization: `Bearer ${v4}` };
  }
  return undefined;
}

function withApiKey(url: string): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) return url; // might rely on v4 header
  const u = new URL(url);
  u.searchParams.set('api_key', key);
  return u.toString();
}

function buildImageUrl(path: string | null | undefined, size: 'w500'|'w780'|'original' = 'original'): string {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
}

async function tmdbFetch(path: string, params: Record<string, string | number | undefined> = {}): Promise<any> {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const finalUrl = getAuthHeaders() ? url.toString() : withApiKey(url.toString());
  const res = await fetch(finalUrl, { headers: getAuthHeaders() });
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
