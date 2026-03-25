import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_prefix: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

import resolveEntityHandler from '../../api/resolveEntity';
import personHandler from '../../api/person/[id]';

describe('integration person search flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'test-key';
  });

  it('supports shortlist then loads selected person profile', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 10, name: 'Chris Evans', popularity: 80, known_for_department: 'Acting', known_for: [{ title: 'Avengers' }] },
            { id: 11, name: 'Chris Hemsworth', popularity: 79, known_for_department: 'Acting', known_for: [{ title: 'Thor' }] }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          name: 'Chris Evans',
          biography: 'Bio',
          profile_path: '/cevans.jpg'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cast: [{ id: 100, media_type: 'movie', title: 'Captain America', release_date: '2011-07-22', character: 'Steve Rogers', poster_path: '/cap.jpg' }],
          crew: []
        })
      });

    const resolveReq = createRequest({ method: 'GET', query: { q: 'Chris' } });
    const resolveRes = createResponse();
    await resolveEntityHandler(resolveReq as any, resolveRes as any);

    const resolved = resolveRes._getJSONData();
    expect(resolved.confidence_band).toBe('shortlist');
    expect(resolved.shortlisted[0].id).toBe(10);

    const personReq = createRequest({ method: 'GET', query: { id: String(resolved.shortlisted[0].id) } });
    const personRes = createResponse();
    await personHandler(personReq as any, personRes as any);

    const profile = personRes._getJSONData();
    expect(personRes.statusCode).toBe(200);
    expect(profile.person.name).toBe('Chris Evans');
    expect(Array.isArray(profile.credits_all)).toBe(true);
    expect(profile.filmography[0].title).toBe('Captain America');
  });

  it('prioritizes role-qualified person query as confident person result', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 200, title: 'Director', popularity: 1 }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 99, name: 'Christopher Nolan', popularity: 150, known_for_department: 'Directing', known_for: [{ title: 'Inception' }] }
          ]
        })
      });

    const req = createRequest({ method: 'GET', query: { q: 'director christopher nolan' } });
    const res = createResponse();
    await resolveEntityHandler(req as any, res as any);

    const data = res._getJSONData();
    expect(data.type).toBe('person');
    expect(data.confidence_band).toBe('confident');
    expect(data.chosen).toEqual({ id: 99, name: 'Christopher Nolan', type: 'person' });
  });
});
