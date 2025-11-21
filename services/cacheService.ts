import { MovieData, GroundingSource } from '../types';

interface CachedResponse {
  movieData: MovieData;
  sources: GroundingSource[] | null;
  timestamp: number;
  query: string;
  provider: string;
}

const CACHE_KEY_PREFIX = 'moviemonk_cache_';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours (reduced from 24h to prevent stale data)

/**
 * Generate a cache key from query
 */
function getCacheKey(query: string, provider: string): string {
  const normalized = query.toLowerCase().trim();
  return `${CACHE_KEY_PREFIX}${provider}_${normalized}`;
}

/**
 * Check if cache entry is still valid
 */
function isValidCache(cached: CachedResponse): boolean {
  const now = Date.now();
  return (now - cached.timestamp) < CACHE_DURATION;
}

/**
 * Get cached response if available and valid
 */
export function getCachedResponse(query: string, provider: string): { movieData: MovieData; sources: GroundingSource[] | null } | null {
  try {
    const key = getCacheKey(query, provider);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const parsedCache: CachedResponse = JSON.parse(cached);
    
    if (!isValidCache(parsedCache)) {
      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`✅ Cache HIT for "${query}" with ${provider}`);
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
    console.log(`💾 Cached response for "${query}" with ${provider}`);
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
            const parsedCache: CachedResponse = JSON.parse(cached);
            if ((now - parsedCache.timestamp) >= CACHE_DURATION) {
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
      console.log(`🗑️  Cleared ${keysToRemove.length} expired cache entries`);
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
    console.log(`🗑️  Cleared all cache (${keysToRemove.length} entries)`);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}
