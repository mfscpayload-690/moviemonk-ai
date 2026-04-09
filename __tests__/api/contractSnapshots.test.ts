import { createRequest, createResponse } from 'node-mocks-http';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({
    ok: true,
    json: { summary_short: 'short', summary_long: 'long' },
    provider: 'groq'
  })
}));

jest.mock('../../services/serpApiService', () => ({
  searchSerpApi: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/perplexityService', () => ({
  searchPerplexity: jest.fn().mockResolvedValue([])
}));

jest.mock('../../services/tmdbService', () => ({
  fetchSimilarTitles: jest.fn().mockResolvedValue([]),
  fetchRelatedPeopleForPerson: jest.fn().mockResolvedValue([])
}));

import aiHandler from '../../api/ai';
import queryHandler from '../../api/query';
import resolveEntityHandler from '../../api/resolveEntity';
import websearchHandler from '../../api/websearch';
import personHandler from '../../api/person/[id]';

const groqHandler = require('../../api/groq');
const omdbHandler = require('../../api/omdb');
const tmdbHandler = require('../../api/tmdb');

const contract = (res: any) => ({ status: res.statusCode, body: res._getJSONData() });

describe('API contract snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TMDB_API_KEY = 'tmdb-key';
  });

  it('api/ai search success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            title: 'Inception',
            media_type: 'movie',
            overview: 'Dream thriller',
            popularity: 87,
            release_date: '2010-07-16',
            poster_path: '/inception.jpg'
          }
        ]
      })
    });

    const req = createRequest({ method: 'GET', query: { action: 'search', q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await aiHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/query missing query contract', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await queryHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/resolveEntity success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 11, title: 'Inception', popularity: 70, release_date: '2010-07-16' }] })
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ id: 99, name: 'Christopher Nolan', popularity: 20 }] })
    });

    const req = createRequest({ method: 'GET', query: { q: 'Inception' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await resolveEntityHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/websearch success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '<a class="result__a" href="https://example.com/inception">Inception review</a><a class="result__snippet">Great movie</a>'
    });

    const req = createRequest({ method: 'GET', query: { q: 'Inception', sources: 'web' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await websearchHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/person/[id] success contract', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 99,
        name: 'Christopher Nolan',
        biography: 'Director',
        birthday: '1970-07-30',
        place_of_birth: 'London',
        profile_path: '/nolan.jpg'
      })
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cast: [{ id: 1, title: 'Inception', release_date: '2010-07-16', character: 'N/A', poster_path: '/inception.jpg' }],
        crew: []
      })
    });

    const req = createRequest({ method: 'GET', query: { id: '99' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await personHandler(req as any, res as any);

    expect(contract(res)).toMatchSnapshot();
  });

  it('api/groq missing key contract', async () => {
    delete process.env.GROQ_API_KEY;
    const req = createRequest({ method: 'POST', body: { messages: [{ role: 'user', content: 'Hi' }] }, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await groqHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/omdb missing id contract', async () => {
    process.env.OMDB_API_KEY = 'omdb-key';
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await omdbHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });

  it('api/tmdb missing endpoint contract', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();
    await tmdbHandler(req, res);
    expect(contract(res)).toMatchSnapshot();
  });
});