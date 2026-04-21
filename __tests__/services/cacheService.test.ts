import {
  cacheResponse,
  getCachedByEntity,
  getCachedResponse,
  linkQueryToEntity,
  resolveEntityFromQuery,
  clearAllCache
} from '../../services/cacheService';
import type { MovieData } from '../../types';

function installMockLocalStorage(): void {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    }
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true
  });
}

function createMovieData(overrides: Partial<MovieData> = {}): MovieData {
  return {
    tmdb_id: '603',
    title: 'The Matrix',
    year: '1999',
    type: 'movie',
    media_type: 'movie',
    genres: ['Science Fiction'],
    poster_url: 'https://example.com/poster.jpg',
    backdrop_url: 'https://example.com/backdrop.jpg',
    trailer_url: 'https://youtube.com/watch?v=x',
    ratings: [],
    cast: [],
    crew: { director: 'Wachowski', writer: 'Wachowski', music: 'Davis' },
    summary_short: 'Short summary',
    summary_medium: 'Medium summary',
    summary_long_spoilers: 'Long summary',
    suspense_breaker: 'Twist',
    where_to_watch: [],
    extra_images: [],
    ai_notes: 'AI notes',
    ...overrides
  };
}

describe('cacheService entity-first caching', () => {
  beforeEach(() => {
    installMockLocalStorage();
    clearAllCache();
  });

  it('stores and resolves query-to-entity mapping', () => {
    linkQueryToEntity('matrix', 'groq', 'movie', '603');

    const resolved = resolveEntityFromQuery('matrix', 'groq');
    expect(resolved).toEqual({ media_type: 'movie', tmdb_id: '603' });
  });

  it('writes entity cache when caching a query and can read by entity key', () => {
    const movie = createMovieData();

    cacheResponse('matrix', 'groq', movie, null);

    const entityCached = getCachedByEntity('groq', 'movie', '603');
    expect(entityCached).not.toBeNull();
    expect(entityCached?.movieData.title).toBe('The Matrix');
  });

  it('supports entity-first retrieval across different queries for same title', () => {
    const movie = createMovieData();

    cacheResponse('matrix 1999', 'groq', movie, null);
    linkQueryToEntity('neo blue pill movie', 'groq', 'movie', '603');

    const cached = getCachedResponse('neo blue pill movie', 'groq');
    expect(cached).not.toBeNull();
    expect(cached?.movieData.tmdb_id).toBe('603');
  });

  it('backfills entity mapping from legacy query cache payload', () => {
    const movie = createMovieData();

    cacheResponse('the matrix film', 'groq', movie, null);

    const resolved = resolveEntityFromQuery('the matrix film', 'groq');
    expect(resolved).toEqual({ media_type: 'movie', tmdb_id: '603' });
  });
});
