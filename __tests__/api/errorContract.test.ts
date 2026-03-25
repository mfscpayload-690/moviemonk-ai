import { createRequest, createResponse } from 'node-mocks-http';

jest.mock('../../lib/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  withCacheKey: jest.fn((_p: string, parts: Record<string, any>) => JSON.stringify(parts))
}));

jest.mock('../../services/ai', () => ({
  generateSummary: jest.fn().mockResolvedValue({ ok: true, json: { summary_short: 'short', summary_long: 'long' }, provider: 'groq' })
}));

import queryHandler from '../../api/query';
import resolveEntityHandler from '../../api/resolveEntity';
import websearchHandler from '../../api/websearch';

describe('api error contract', () => {
  it('query returns standardized forbidden_origin error', async () => {
    const req = createRequest({
      method: 'GET',
      query: { q: 'Interstellar' },
      headers: { host: 'localhost:3000', origin: 'https://evil.example.com' }
    });
    const res = createResponse();

    await queryHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('forbidden_origin');
    expect(typeof body.error).toBe('string');
  });

  it('resolveEntity returns standardized missing_query error', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await resolveEntityHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('missing_query');
  });

  it('websearch returns standardized query_too_short error', async () => {
    const req = createRequest({ method: 'GET', query: { q: 'a' }, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await websearchHandler(req as any, res as any);
    const body = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error_code).toBe('query_too_short');
  });
});
