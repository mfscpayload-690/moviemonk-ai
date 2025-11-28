import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import handler from '../../api/person/[id]';

describe('/api/person/[id]', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('returns person details and filmography', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 99,
          name: 'Christopher Nolan',
          biography: 'Famous director.',
          birthday: '1970-07-30',
          place_of_birth: 'London',
          profile_path: '/nolan.jpg'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cast: [],
          crew: [{ id: 1, title: 'Inception', release_date: '2010-07-16', job: 'Director', poster_path: '/inception.jpg' }]
        })
      });

    const req = createRequest({ method: 'GET', query: { id: '99' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.person.name).toBe('Christopher Nolan');
    expect(data.filmography.length).toBeGreaterThan(0);
    expect(data.sources).toBeDefined();
  });

  it('returns 400 if id is missing', async () => {
    const req = createRequest({ method: 'GET', query: {} });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});
