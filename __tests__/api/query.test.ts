import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({ ok: true, json: { summary_short: 'short', summary_long: 'long' }, provider: 'groq' })
}));

import handler from '../../api/query';

describe('/api/query', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns person summary when resolved as person', async () => {
    // resolveEntity → person
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'person', chosen: { id: 99, name: 'Christopher Nolan', type: 'person' }, candidates: [] })
    });
    // person API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ person: { id: 99, name: 'Christopher Nolan', biography: 'Director.' }, filmography: [], sources: [] })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Christopher Nolan' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.type).toBe('person');
    expect(data.summary).toBeDefined();
  });

  it('returns movie summary when resolved as movie', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'movie', chosen: { id: 1, name: 'Interstellar', type: 'movie' }, candidates: [] })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        title: 'Interstellar',
        release_date: '2014-11-07',
        overview: 'Space epic.',
        genres: [{ name: 'Sci-Fi' }],
        poster_path: '/inter.jpg',
        backdrop_path: '/back.jpg'
      })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cast: [{ name: 'Matthew McConaughey', character: 'Cooper' }],
        crew: [{ name: 'Christopher Nolan', job: 'Director' }]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Interstellar 2014' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.ok).toBe(true);
    expect(data.type).toBe('movie');
    expect(data.data?.movie?.title).toBe('Interstellar');
    expect(data.summary).toBeDefined();
  });

  it('returns 400 when q is missing', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});
