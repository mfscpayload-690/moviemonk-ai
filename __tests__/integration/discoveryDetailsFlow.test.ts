import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import aiHandler from '../../api/ai';

describe('integration discovery details flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.TMDB_READ_TOKEN;
  });

  it('returns detailed movie payload by direct tmdb id/media_type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 550,
        title: 'Fight Club',
        release_date: '1999-10-15',
        overview: 'An insomniac forms an underground fight club.',
        genres: [{ id: 18, name: 'Drama' }],
        poster_path: '/fight.jpg',
        backdrop_path: '/fight-bg.jpg',
        vote_average: 8.4,
        credits: {
          cast: [
            { name: 'Brad Pitt', character: 'Tyler Durden', known_for_department: 'Acting' }
          ],
          crew: [
            { name: 'David Fincher', job: 'Director' }
          ]
        },
        videos: { results: [] },
        images: { backdrops: [], posters: [] },
        recommendations: { results: [] },
        'watch/providers': { results: {} }
      })
    });

    const req = createRequest({
      method: 'GET',
      query: { action: 'details', id: '550', media_type: 'movie', provider: 'groq' },
      headers: { host: 'localhost:3000' }
    });
    const res = createResponse();

    await aiHandler(req as any, res as any);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.title).toBe('Fight Club');
    expect(data.tmdb_id).toBe('550');
    expect(data.media_type).toBe('movie');
    expect(data.type).toBe('movie');
    expect(Array.isArray(data.cast)).toBe(true);
    expect(data.cast[0].name).toBe('Brad Pitt');
    expect(data.summary_medium).toContain('insomniac');
  });
});
