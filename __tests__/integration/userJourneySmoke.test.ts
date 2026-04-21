import { createRequest, createResponse } from 'node-mocks-http';
import { QueryComplexity, MovieData } from '../../types';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../services/cacheService', () => ({
  getCachedResponse: jest.fn().mockReturnValue(null),
  getCachedByEntity: jest.fn().mockReturnValue(null),
  resolveEntityFromQuery: jest.fn().mockReturnValue(null),
  cacheResponse: jest.fn(),
  clearOldCacheEntries: jest.fn()
}));

jest.mock('../../services/indexedDBService', () => ({
  getFromIndexedDB: jest.fn().mockResolvedValue(null),
  saveToIndexedDB: jest.fn(),
  clearOldIndexedDBEntries: jest.fn()
}));

jest.mock('../../services/queryParser', () => ({
  parseQuery: jest.fn().mockImplementation((q: string) => ({ originalQuery: q, title: q, year: '', type: 'movie' })),
  shouldUseComplexModel: jest.fn().mockReturnValue(false)
}));

jest.mock('../../services/hybridDataService', () => ({
  fetchFromBestSource: jest.fn()
}));

jest.mock('../../services/perplexityService', () => ({
  searchWithPerplexity: jest.fn().mockResolvedValue(null),
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'perplexity unavailable' })
}));

jest.mock('../../services/groqService', () => ({
  fetchMovieData: jest.fn()
}));

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/serpApiService', () => ({
  searchSerpApi: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/tmdbService', () => ({
  fetchSimilarTitles: jest.fn().mockResolvedValue([])
}));

import aiHandler from '../../api/ai';
import { fetchMovieData } from '../../services/aiService';
import { fetchMovieData as fetchFromGroq } from '../../services/groqService';
import { fetchFromBestSource } from '../../services/hybridDataService';
import { buildBalancedMixRow, dedupeSectionsByTitle } from '../../hooks/useDiscovery';
import {
  addFolderToWatchlists,
  saveMovieToFolder,
  saveWatchlistsToStorage,
  loadWatchlistsFromStorage,
  findFolderItem
} from '../../hooks/watchlistStore';

function makeMovie(title: string): MovieData {
  return {
    tmdb_id: '27205',
    title,
    year: '2010',
    type: 'movie',
    media_type: 'movie',
    genres: ['Sci-Fi'],
    poster_url: 'https://img/p.jpg',
    backdrop_url: 'https://img/b.jpg',
    trailer_url: '',
    ratings: [{ source: 'TMDB', score: '88%' }],
    cast: [{ name: 'Leonardo DiCaprio', role: 'Cobb', known_for: 'Inception' }],
    crew: { director: 'Christopher Nolan', writer: 'Christopher Nolan', music: 'Hans Zimmer' },
    summary_short: 'A thief enters dreams.',
    summary_medium: 'A skilled thief steals secrets through dream-sharing technology.',
    summary_long_spoilers: '',
    suspense_breaker: '',
    where_to_watch: [],
    extra_images: [],
    ai_notes: ''
  };
}

describe('integration smoke: user journey and provider fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('covers search -> disambiguation -> details -> watchlist save/load', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 27205,
            title: 'Inception',
            media_type: 'movie',
            overview: 'Dream heist',
            popularity: 99,
            release_date: '2010-07-16',
            poster_path: '/inception.jpg'
          },
          {
            id: 123,
            title: 'Inception: The Cobol Job',
            media_type: 'movie',
            overview: 'Animated prequel',
            popularity: 20,
            release_date: '2010-12-07',
            poster_path: '/cobol.jpg'
          }
        ]
      })
    });

    const searchReq = createRequest({ method: 'GET', query: { action: 'search', q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const searchRes = createResponse();
    await aiHandler(searchReq as any, searchRes as any);

    const searchData = searchRes._getJSONData();
    expect(searchRes.statusCode).toBe(200);
    expect(searchData.ok).toBe(true);
    expect(searchData.total).toBeGreaterThan(1);
    expect(searchData.results[0].title).toContain('Inception');

    const selectReq = createRequest({ method: 'GET', query: { action: 'selectModel', type: 'movie', title: 'Inception' }, headers: { host: 'localhost:3000' } });
    const selectRes = createResponse();
    await aiHandler(selectReq as any, selectRes as any);
    const selectData = selectRes._getJSONData();
    expect(selectRes.statusCode).toBe(200);
    expect(selectData.ok).toBe(true);
    expect(selectData.selectedModel).toBeTruthy();

    (fetchFromBestSource as jest.Mock).mockResolvedValueOnce({
      data: makeMovie('Inception'),
      source: 'tmdb',
      confidence: 0.95
    });
    (fetchFromGroq as jest.Mock).mockResolvedValueOnce({
      movieData: {
        summary_short: 'A dream-thief accepts an impossible task.',
        summary_medium: 'Dom Cobb must plant an idea inside a target mind.',
        summary_long_spoilers: 'Spoilers...',
        suspense_breaker: 'The ending remains debated.',
        ai_notes: 'Creative overlay.'
      },
      sources: null
    });

    const details = await fetchMovieData('Inception', QueryComplexity.SIMPLE, 'groq');
    expect(details.movieData).toBeTruthy();
    expect(details.movieData?.title).toBe('Inception');
    expect(details.movieData?.summary_short).toContain('dream-thief');

    let folders: any[] = [];
    const add = addFolderToWatchlists(folders, 'Weekend Picks', '#7c3aed');
    expect(add.folderId).toBeTruthy();
    folders = saveMovieToFolder(add.next, add.folderId as string, details.movieData as MovieData, 'Inception (Saved)');

    const memoryStorage = {
      data: {} as Record<string, string>,
      getItem(key: string) {
        return this.data[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.data[key] = value;
      }
    };

    saveWatchlistsToStorage(memoryStorage as any, folders);
    const loaded = loadWatchlistsFromStorage(memoryStorage as any);
    expect(loaded.length).toBe(1);
    expect(loaded[0].items.length).toBe(1);

    const found = findFolderItem(loaded, loaded[0].id, loaded[0].items[0].id);
    expect(found?.item.saved_title).toBe('Inception (Saved)');
    expect(found?.item.movie.title).toBe('Inception');
  });

  it('returns factual data when Groq enrichment fails', async () => {
    (fetchFromBestSource as jest.Mock).mockResolvedValueOnce({
      data: makeMovie('Interstellar'),
      source: 'tmdb',
      confidence: 0.94
    });

    (fetchFromGroq as jest.Mock).mockResolvedValueOnce({
      movieData: null,
      sources: null,
      error: 'Groq unavailable'
    });

    const result = await fetchMovieData('Interstellar', QueryComplexity.SIMPLE, 'groq');

    expect(fetchFromGroq).toHaveBeenCalled();
    expect(result.provider).toBe('groq');
    expect(result.movieData?.title).toBe('Interstellar');
    expect(result.movieData?.summary_short).toBe('A thief enters dreams.');
  });

  it('keeps dashboard mixes deterministic and globally de-duplicated', () => {
    const mixed = buildBalancedMixRow(
      6,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global Two', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global Three', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        bollywood: [
          { id: 11, tmdb_id: '11', media_type: 'movie', title: 'Bollywood One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        asian: [
          { id: 21, tmdb_id: '21', media_type: 'movie', title: 'Asian One', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    const dedupedSections = dedupeSectionsByTitle([
      { key: 'first', title: 'First', items: mixed },
      {
        key: 'second',
        title: 'Second',
        items: [
          { id: 30, tmdb_id: '30', media_type: 'movie', title: 'Global Two', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 31, tmdb_id: '31', media_type: 'movie', title: 'Second Unique', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      }
    ]);

    expect(mixed.map((item) => item.title)).toEqual([
      'Global One',
      'Global Two',
      'Global Three',
      'Bollywood One',
      'Asian One'
    ]);
    expect(dedupedSections[1].items.map((item) => item.title)).toEqual(['Second Unique']);
  });
});