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

  it('returns enriched person profile with backward-compatible filmography', async () => {
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
          cast: [
            {
              id: 2,
              media_type: 'movie',
              title: 'Oppenheimer',
              release_date: '2023-07-21',
              character: 'Narrator',
              poster_path: '/oppenheimer.jpg',
              popularity: 99
            }
          ],
          crew: [
            {
              id: 1,
              media_type: 'movie',
              title: 'Inception',
              release_date: '2010-07-16',
              job: 'Director',
              department: 'Directing',
              poster_path: '/inception.jpg',
              popularity: 100
            }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { id: '99' } });
    const res = createResponse();
    await handler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.person.name).toBe('Christopher Nolan');
    expect(data.filmography.length).toBeGreaterThan(0);
    expect(Array.isArray(data.top_work)).toBe(true);
    expect(Array.isArray(data.credits_all)).toBe(true);
    expect(Array.isArray(data.credits_acting)).toBe(true);
    expect(Array.isArray(data.credits_directing)).toBe(true);
    expect(data.role_distribution).toEqual(expect.objectContaining({
      acting: expect.any(Number),
      directing: expect.any(Number),
      other: expect.any(Number)
    }));
    expect(data.career_span).toEqual(expect.objectContaining({
      start_year: expect.any(Number),
      end_year: expect.any(Number),
      active_years: expect.any(Number)
    }));
    expect(data.filmography[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      title: expect.any(String),
      role: expect.any(String),
      media_type: expect.stringMatching(/movie|tv/)
    }));
    expect(data.sources).toBeDefined();
  });

  it('returns 400 if id is missing', async () => {
    const req = createRequest({ method: 'GET', query: {} });
    const res = createResponse();
    await handler(req as any, res as any);
    expect(res.statusCode).toBe(400);
  });
});
