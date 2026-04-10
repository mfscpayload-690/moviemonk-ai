import { createRequest, createResponse } from 'node-mocks-http';
import handler from '../../api/vibe';

describe('/api/vibe', () => {
  it('returns parsed vibe contract for valid query', async () => {
    const req = createRequest({
      method: 'GET',
      query: { q: 'cozy thriller under 100 minutes without gore' },
      headers: { host: 'localhost:3000' },
    });
    const res = createResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.query_raw).toBe('cozy thriller under 100 minutes without gore');
    expect(data.hard_constraints.max_runtime_minutes).toBe(100);
    expect(data.hard_constraints.exclude_genres).toEqual([]);
    expect(data.ranking_hints.penalize_terms).toContain('without gore');
    expect(data.soft_preferences.tone_tags).toContain('cozy');
  });

  it('returns 400 for missing query', async () => {
    const req = createRequest({ method: 'GET', query: {}, headers: { host: 'localhost:3000' } });
    const res = createResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(400);
  });
});
