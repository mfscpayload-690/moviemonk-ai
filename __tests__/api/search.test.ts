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
});
