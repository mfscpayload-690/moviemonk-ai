import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import handler from '../../api/suggest';

describe('/api/suggest', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns empty list for short query', async () => {
    const req = createRequest({ method: 'GET', query: { q: 'f' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.suggestions).toEqual([]);
  });

  it('ranks exact match above partial match', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            title: 'Fresh',
            media_type: 'movie',
            popularity: 20,
            release_date: '2022-03-01',
            poster_path: '/fresh.jpg'
          },
          {
            id: 2,
            title: 'Fresh Prince',
            media_type: 'tv',
            popularity: 60,
            first_air_date: '1990-01-01',
            poster_path: '/fresh-prince.jpg'
          },
          {
            id: 3,
            title: 'Not Related',
            media_type: 'movie',
            popularity: 99,
            release_date: '2024-01-01'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Fresh' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.suggestions[0].title).toBe('Fresh');
    expect(data.suggestions[0].type).toBe('movie');
    expect(data.suggestions[0]).not.toHaveProperty('score');
    expect(data.suggestions[0]).not.toHaveProperty('popularity');
  });

  it('applies year boost when query contains year', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 11,
            title: 'Dune',
            media_type: 'movie',
            popularity: 10,
            release_date: '2021-10-22'
          },
          {
            id: 12,
            title: 'Dune',
            media_type: 'movie',
            popularity: 10,
            release_date: '1984-12-14'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Dune 2021' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data.suggestions[0].year).toBe('2021');
  });
});
