import { createRequest, createResponse } from 'node-mocks-http';
import handler from '../../api/search';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

describe('/api/search', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
    delete process.env.TMDB_READ_TOKEN;
  });

  it('relaxes person-role typos and returns results for chris eevans as captian america', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] , total_pages: 1, total_results: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 1,
              title: 'Chris Evans',
              media_type: 'person',
              name: 'Chris Evans',
              popularity: 98,
              profile_path: '/chris.jpg',
              known_for_department: 'Acting',
              known_for: [{ title: 'Captain America: The First Avenger' }]
            }
          ],
          total_pages: 1,
          total_results: 1
        })
      });

    const req = createRequest({
      method: 'GET',
      query: { q: 'chris eevans as captian america' },
      headers: { host: 'localhost:3000' }
    });
    const res = createResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.people.length).toBeGreaterThan(0);
    expect(data.people[0].name).toBe('Chris Evans');
  });

  it('uses vibe discovery for semantic queries and returns ranked titles with reasons', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], total_pages: 1, total_results: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 101,
              title: 'Night Circuit',
              media_type: 'movie',
              release_date: '2024-04-12',
              overview: 'A tense thriller with an urgent pulse.',
              poster_path: '/night-circuit.jpg',
              backdrop_path: '/night-circuit-bg.jpg',
              vote_average: 8.4,
              popularity: 94,
              genre_ids: [53]
            }
          ],
          total_pages: 8,
          total_results: 160
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 202,
              name: 'Signal Run',
              media_type: 'tv',
              first_air_date: '2024-05-01',
              overview: 'Fast, dark, and highly rated.',
              poster_path: '/signal-run.jpg',
              backdrop_path: '/signal-run-bg.jpg',
              vote_average: 8.1,
              popularity: 81,
              genre_ids: [53, 18]
            }
          ],
          total_pages: 6,
          total_results: 120
        })
      });

    const req = createRequest({
      method: 'POST',
      body: {
        q: 'Best recent thriller movies and shows with strong ratings',
        vibe: {
          query_raw: 'Best recent thriller movies and shows with strong ratings',
          intent_type: 'vibe_discovery',
          confidence: 0.92,
          fallback_query_terms: ['thriller', 'recent', 'ratings'],
          hard_constraints: {
            media_type: 'any',
            include_genres: ['thriller'],
            exclude_genres: [],
            languages: [],
            include_people: [],
            exclude_people: [],
            release_year_min: null,
            release_year_max: null,
            max_runtime_minutes: null,
            min_runtime_minutes: null
          },
          soft_preferences: {
            tone_tags: ['tense'],
            story_cues: ['urgent'],
            reference_titles: []
          },
          ranking_hints: {
            boost_keyword_terms: ['thriller', 'ratings'],
            boost_overview_terms: ['tense'],
            penalize_terms: []
          },
          notes_for_retrieval: []
        }
      },
      headers: { host: 'localhost:3000' }
    });
    const res = createResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.search_mode).toBe('vibe');
    expect(data.total_results).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0].match_reasons).toContain('Thriller');
    expect(data.results[0].vibe_score).toBeGreaterThan(0);
    expect(data.vibe.summary).toContain('thriller');
    expect(data.did_you_mean).toEqual([]);
  });
});
