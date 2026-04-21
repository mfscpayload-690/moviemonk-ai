import { MovieData, GroundingSource } from '../types';

interface CachedResponse {
  movieData: MovieData;
  sources: GroundingSource[] | null;
  timestamp: number;
  query: string;
  provider: string;
}

interface QueryEntityIndexEntry {
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  timestamp: number;
  provider: string;
  query: string;
}

const CACHE_KEY_PREFIX = 'moviemonk_cache_';
const CACHE_ENTITY_KEY_PREFIX = `${CACHE_KEY_PREFIX}entity_`;
const CACHE_QUERY_INDEX_KEY_PREFIX = `${CACHE_KEY_PREFIX}qidx_`;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (reduced from 24h to prevent stale data)

/**
 * Generate a cache key from query
 */
function getCacheKey(query: string, provider: string): string {
  const normalized = query.toLowerCase().trim();
  return `${CACHE_KEY_PREFIX}${provider}_${normalized}`;
}

function getQueryIndexKey(query: string, provider: string): string {
  const normalized = query.toLowerCase().trim();
  return `${CACHE_QUERY_INDEX_KEY_PREFIX}${provider}_${normalized}`;
}

function getEntityCacheKey(provider: string, mediaType: 'movie' | 'tv', tmdbId: string): string {
  return `${CACHE_ENTITY_KEY_PREFIX}${provider}_${mediaType}_${String(tmdbId).trim()}`;
}

function normalizeMediaTypeFromMovie(movieData: MovieData): 'movie' | 'tv' | null {
  if (movieData.media_type === 'movie' || movieData.media_type === 'tv') {
    return movieData.media_type;
  }
  if (movieData.type === 'show') return 'tv';
  if (movieData.type === 'movie') return 'movie';
  return null;
}

function getEntityFromMovie(movieData: MovieData): { tmdb_id: string; media_type: 'movie' | 'tv' } | null {
  const tmdbId = String(movieData.tmdb_id || '').trim();
  if (!tmdbId) return null;

  const mediaType = normalizeMediaTypeFromMovie(movieData);
  if (!mediaType) return null;

  return {
    tmdb_id: tmdbId,
    media_type: mediaType
  };
}

/**
 * Check if cache entry is still valid
 */
function isValidTimestamp(timestamp: number): boolean {
  const now = Date.now();
  return Number.isFinite(timestamp) && (now - timestamp) < CACHE_DURATION;
}

/**
 * Check if cache entry is still valid
 */
function isValidCache(cached: CachedResponse): boolean {
  return isValidTimestamp(cached.timestamp);
}

/**
 * Resolve entity tuple from query, when known.
 */
export function resolveEntityFromQuery(
  query: string,
  provider: string
): { tmdb_id: string; media_type: 'movie' | 'tv' } | null {
  try {
    const key = getQueryIndexKey(query, provider);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as QueryEntityIndexEntry;
    if (!parsed || !isValidTimestamp(parsed.timestamp)) {
      localStorage.removeItem(key);
      return null;
    }

    if (!parsed.tmdb_id || (parsed.media_type !== 'movie' && parsed.media_type !== 'tv')) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      tmdb_id: parsed.tmdb_id,
      media_type: parsed.media_type
    };
  } catch {
    return null;
  }
}

/**
 * Link a search query to an entity cache key.
 */
export function linkQueryToEntity(
  query: string,
  provider: string,
  mediaType: 'movie' | 'tv',
  tmdbId: string
): void {
  try {
    const key = getQueryIndexKey(query, provider);
    const payload: QueryEntityIndexEntry = {
      query: query.toLowerCase().trim(),
      provider,
      media_type: mediaType,
      tmdb_id: String(tmdbId).trim(),
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Best effort only.
  }
}

/**
 * Get cached response by entity key.
 */
export function getCachedByEntity(
  provider: string,
  mediaType: 'movie' | 'tv',
  tmdbId: string
): { movieData: MovieData; sources: GroundingSource[] | null } | null {
  try {
    const key = getEntityCacheKey(provider, mediaType, tmdbId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedResponse;
    if (!isValidCache(parsed)) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      movieData: parsed.movieData,
      sources: parsed.sources
    };
  } catch {
    return null;
  }
}

/**
 * Save response to entity cache.
 */
export function setCachedByEntity(
  provider: string,
  mediaType: 'movie' | 'tv',
  tmdbId: string,
  movieData: MovieData,
  sources: GroundingSource[] | null,
  query = ''
): void {
  try {
    const key = getEntityCacheKey(provider, mediaType, tmdbId);
    const payload: CachedResponse = {
      movieData,
      sources,
      timestamp: Date.now(),
      query: query.toLowerCase().trim(),
      provider
    };

    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Best effort only.
  }
}

/**
 * Get cached response if available and valid
 */
export function getCachedResponse(query: string, provider: string): { movieData: MovieData; sources: GroundingSource[] | null } | null {
  try {
    // Entity-first path via query->entity index.
    const resolved = resolveEntityFromQuery(query, provider);
    if (resolved) {
      const entityCached = getCachedByEntity(provider, resolved.media_type, resolved.tmdb_id);
      if (entityCached) {
        console.log(`[cache] entity hit for "${query}" with ${provider}`);
        return entityCached;
      }
    }

    // Legacy query-key fallback.
    const key = getCacheKey(query, provider);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsedCache: CachedResponse = JSON.parse(cached);
    
    if (!isValidCache(parsedCache)) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }

    // Backfill entity cache/index from legacy query cache when possible.
    const entity = getEntityFromMovie(parsedCache.movieData);
    if (entity) {
      setCachedByEntity(provider, entity.media_type, entity.tmdb_id, parsedCache.movieData, parsedCache.sources, query);
      linkQueryToEntity(query, provider, entity.media_type, entity.tmdb_id);
    }
    
    console.log(`[cache] hit for "${query}" with ${provider}`);
    return {
      movieData: parsedCache.movieData,
      sources: parsedCache.sources
    };
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Save response to cache
 */
export function cacheResponse(
  query: string,
  provider: string,
  movieData: MovieData,
  sources: GroundingSource[] | null
): void {
  try {
    const key = getCacheKey(query, provider);
    const cacheEntry: CachedResponse = {
      movieData,
      sources,
      timestamp: Date.now(),
      query: query.toLowerCase().trim(),
      provider
    };
    
    localStorage.setItem(key, JSON.stringify(cacheEntry));

    // Write entity cache/index whenever TMDB entity data is present.
    const entity = getEntityFromMovie(movieData);
    if (entity) {
      setCachedByEntity(provider, entity.media_type, entity.tmdb_id, movieData, sources, query);
      linkQueryToEntity(query, provider, entity.media_type, entity.tmdb_id);
    }

    console.log(`[cache] stored response for "${query}" with ${provider}`);
  } catch (error) {
    console.warn('Cache write error (storage might be full):', error);
    // Try to clear old cache entries
    clearOldCacheEntries();
  }
}

/**
 * Clear expired cache entries
 */
export function clearOldCacheEntries(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached) as { timestamp?: number };
            if (!Number.isFinite(parsedCache.timestamp) || (now - Number(parsedCache.timestamp)) >= CACHE_DURATION) {
              keysToRemove.push(key);
            }
          } catch (e) {
            // Invalid cache entry, remove it
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`[cache] cleared ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.warn('Failed to clear old cache entries:', error);
  }
}

/**
 * Clear all MovieMonk cache
 */
export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[cache] cleared all cache (${keysToRemove.length} entries)`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}
