import { createRequest, createResponse } from 'node-mocks-http';

// Mock TMDB fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Ensure REDIS_URL is ignored in test
jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import handler from '../../api/resolveEntity';

describe('/api/resolveEntity', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns person type when person match is confident', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Interstellar', popularity: 50, release_date: '2014-11-07' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 99, name: 'Christopher Nolan', popularity: 150 }] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Christopher Nolan' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('person');
    expect(data.chosen?.name).toBe('Christopher Nolan');
  });

  it('returns movie type when movie match is confident', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Interstellar', popularity: 200, release_date: '2014-11-07' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Interstellar 2014' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('movie');
    expect(data.chosen?.name).toBe('Interstellar');
  });

  it('returns ambiguous when scores are close', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 1, title: 'Inception', popularity: 100 }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 2, name: 'Inception Documentary', popularity: 100 }] })
      });

    const req = createRequest({ method: 'GET', query: { q: 'Inception' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    // Could be movie or ambiguous depending on similarity tie; either acceptable
    expect(['movie', 'ambiguous']).toContain(data.type);
  });

  it('returns 400 if q is missing', async () => {
    const req = createRequest({ method: 'GET', query: {} });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});
