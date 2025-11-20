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
}

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
function generateKey(query: string, provider: string): string {
  return `${provider}_${query.toLowerCase().trim()}`;
}

/**
 * Get cached movie from IndexedDB
 */
export async function getFromIndexedDB(
  query: string,
  provider: string
): Promise<{ movieData: MovieData; sources: GroundingSource[] | null } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const key = generateKey(query, provider);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const cached: CachedMovie | undefined = request.result;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid (30 days)
        const age = Date.now() - cached.timestamp;
        const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (age > MAX_AGE) {
          // Cache expired, delete it
          deleteFromIndexedDB(query, provider);
          resolve(null);
          return;
        }

        console.log(`✅ IndexedDB HIT for "${query}" with ${provider}`);
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
      id: generateKey(query, provider),
      query: query.toLowerCase().trim(),
      movieData,
      sources,
      timestamp: Date.now(),
      provider
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cached);

      request.onsuccess = () => {
        console.log(`💾 Saved to IndexedDB: "${query}" with ${provider}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
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
    const key = generateKey(query, provider);

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
 * Clear all old entries (older than 30 days)
 */
export async function clearOldIndexedDBEntries(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = Date.now() - MAX_AGE;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🗑️  Cleared ${deletedCount} old IndexedDB entries`);
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

      request.onsuccess = () => resolve(request.result || []);
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
        console.log('🗑️  Cleared all IndexedDB cache');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
}
