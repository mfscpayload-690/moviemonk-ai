import { MovieData, GroundingSource } from '../types';

const DB_NAME = 'MovieMonkDB';
const DB_VERSION = 1;
const STORE_NAME = 'movieCache';

interface CachedMovie {
  id: string;
  query: string;
  movieData: MovieData;
  sources: GroundingSource[] | null;
  timestamp: number;
  provider: string;
  kind?: 'query' | 'entity';
}

interface QueryEntityIndexEntry {
  id: string;
  query: string;
  provider: string;
  tmdb_id: string;
  media_type: 'movie' | 'tv';
  timestamp: number;
  kind: 'qidx';
}

type CacheRecord = CachedMovie | QueryEntityIndexEntry;

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const ENTITY_KEY_PREFIX = 'entity_';
const QUERY_INDEX_KEY_PREFIX = 'qidx_';

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('query', 'query', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Generate cache key from query
 */
function generateQueryKey(query: string, provider: string): string {
  return `${provider}_${query.toLowerCase().trim()}`;
}

function generateEntityKey(provider: string, mediaType: 'movie' | 'tv', tmdbId: string): string {
  return `${ENTITY_KEY_PREFIX}${provider}_${mediaType}_${String(tmdbId).trim()}`;
}

function generateQueryIndexKey(query: string, provider: string): string {
  return `${QUERY_INDEX_KEY_PREFIX}${provider}_${query.toLowerCase().trim()}`;
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

function isValidTimestamp(timestamp: number): boolean {
  return Number.isFinite(timestamp) && (Date.now() - timestamp) < CACHE_DURATION;
}

export async function resolveEntityFromIndexedDB(
  query: string,
  provider: string
): Promise<{ tmdb_id: string; media_type: 'movie' | 'tv' } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateQueryIndexKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result as QueryEntityIndexEntry | undefined;
        if (!record || record.kind !== 'qidx') {
          resolve(null);
          return;
        }

        if (!isValidTimestamp(record.timestamp)) {
          store.delete(key);
          resolve(null);
          return;
        }

        if (!record.tmdb_id || (record.media_type !== 'movie' && record.media_type !== 'tv')) {
          store.delete(key);
          resolve(null);
          return;
        }

        resolve({
          tmdb_id: record.tmdb_id,
          media_type: record.media_type
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function linkQueryToEntityInIndexedDB(
  query: string,
  provider: string,
  mediaType: 'movie' | 'tv',
  tmdbId: string
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const payload: QueryEntityIndexEntry = {
      id: generateQueryIndexKey(query, provider),
      query: query.toLowerCase().trim(),
      provider,
      media_type: mediaType,
      tmdb_id: String(tmdbId).trim(),
      timestamp: Date.now(),
      kind: 'qidx'
    };

    return new Promise((resolve, reject) => {
      const request = store.put(payload);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Best effort only.
  }
}

export async function getFromIndexedDBByEntity(
  provider: string,
  mediaType: 'movie' | 'tv',
  tmdbId: string
): Promise<{ movieData: MovieData; sources: GroundingSource[] | null } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateEntityKey(provider, mediaType, tmdbId);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedMovie | undefined;
        if (!cached) {
          resolve(null);
          return;
        }

        if (!isValidTimestamp(cached.timestamp)) {
          store.delete(key);
          resolve(null);
          return;
        }

        resolve({
          movieData: cached.movieData,
          sources: cached.sources
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Get cached movie from IndexedDB
 */
export async function getFromIndexedDB(
  query: string,
  provider: string
): Promise<{ movieData: MovieData; sources: GroundingSource[] | null } | null> {
  try {
    // Entity-first path via query->entity index.
    const entity = await resolveEntityFromIndexedDB(query, provider);
    if (entity) {
      const byEntity = await getFromIndexedDBByEntity(provider, entity.media_type, entity.tmdb_id);
      if (byEntity) {
        console.log(`[indexeddb] entity hit for "${query}" with ${provider}`);
        return byEntity;
      }
    }

    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateQueryKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const cached: CachedMovie | undefined = request.result;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid (7 days - reduced from 30 for accuracy)
        if (!isValidTimestamp(cached.timestamp)) {
          // Cache expired, delete it
          deleteFromIndexedDB(query, provider);
          resolve(null);
          return;
        }

        // Invalidate entries where cast data is missing profile_url (pre-v2 data)
        const cast = cached.movieData?.cast;
        if (Array.isArray(cast) && cast.length > 0 && !cast[0].profile_url) {
          console.log(`[indexeddb] stale cast data for "${query}", refetching`);
          deleteFromIndexedDB(query, provider);
          resolve(null);
          return;
        }

        // Backfill entity cache/index from legacy query-key entries when possible.
        const resolvedEntity = getEntityFromMovie(cached.movieData);
        if (resolvedEntity) {
          void saveToIndexedDB(query, provider, cached.movieData, cached.sources);
        }

        console.log(`[indexeddb] hit for "${query}" with ${provider}`);
        resolve({
          movieData: cached.movieData,
          sources: cached.sources
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB read error:', error);
    return null;
  }
}

/**
 * Save movie to IndexedDB
 */
export async function saveToIndexedDB(
  query: string,
  provider: string,
  movieData: MovieData,
  sources: GroundingSource[] | null
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cached: CachedMovie = {
      id: generateQueryKey(query, provider),
      query: query.toLowerCase().trim(),
      movieData,
      sources,
      timestamp: Date.now(),
      provider,
      kind: 'query'
    };

    return new Promise((resolve, reject) => {
      const primaryWrite = store.put(cached);

      primaryWrite.onsuccess = () => {
        const entity = getEntityFromMovie(movieData);
        if (!entity) {
          console.log(`[indexeddb] saved "${query}" with ${provider}`);
          resolve();
          return;
        }

        const entityRecord: CachedMovie = {
          ...cached,
          id: generateEntityKey(provider, entity.media_type, entity.tmdb_id),
          kind: 'entity'
        };

        const entityWrite = store.put(entityRecord);
        entityWrite.onsuccess = () => {
          void linkQueryToEntityInIndexedDB(query, provider, entity.media_type, entity.tmdb_id);
          console.log(`[indexeddb] saved "${query}" with ${provider}`);
          resolve();
        };
        entityWrite.onerror = () => reject(entityWrite.error);
      };

      primaryWrite.onerror = () => reject(primaryWrite.error);
    });
  } catch (error) {
    console.warn('IndexedDB write error:', error);
  }
}

/**
 * Delete from IndexedDB
 */
export async function deleteFromIndexedDB(query: string, provider: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateQueryKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB delete error:', error);
  }
}

/**
 * Clear all old entries (older than 7 days)
 */
export async function clearOldIndexedDBEntries(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const cutoff = Date.now() - CACHE_DURATION;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const value = cursor.value as { timestamp?: number };
          if (!Number.isFinite(value.timestamp) || Number(value.timestamp) < cutoff) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`[indexeddb] cleared ${deletedCount} old entries`);
          }
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear old IndexedDB entries:', error);
  }
}

/**
 * Get all cached movies (for debugging/statistics)
 */
export async function getAllCachedMovies(): Promise<CachedMovie[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const all = (request.result || []) as CacheRecord[];
        const onlyMovieRecords = all.filter((record): record is CachedMovie => {
          const maybe = record as CachedMovie;
          return Boolean(maybe.movieData && maybe.sources !== undefined);
        });
        resolve(onlyMovieRecords);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get all cached movies:', error);
    return [];
  }
}

/**
 * Clear all IndexedDB cache
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[indexeddb] cleared all cache entries');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}
