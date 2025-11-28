// Mock provider fetch calls
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock('../services/groqService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: { summary_short: 'Short', summary_long: 'Long' }, sources: null, provider: 'groq' })
}));

jest.mock('../services/mistralService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'Mistral failed' })
}));

jest.mock('../services/openrouterService', () => ({
  fetchMovieData: jest.fn().mockResolvedValue({ movieData: null, sources: null, error: 'OpenRouter failed' })
}));

import { generateSummary, parseJsonResponse } from '../../services/ai';

describe('services/ai', () => {
  it('parseJsonResponse extracts JSON from fenced code block', () => {
    const raw = '```json\n{"foo":"bar"}\n```';
    const result = parseJsonResponse(raw);
    expect(result).toEqual({ foo: 'bar' });
  });

  it('parseJsonResponse handles plain JSON', () => {
    const raw = '{"a":1}';
    const result = parseJsonResponse(raw);
    expect(result).toEqual({ a: 1 });
  });

  it('generateSummary returns json from first successful provider', async () => {
    const result = await generateSummary({ evidence: 'test', query: 'test', schema: { summary_short: 'string' }, timeoutMs: 5000 });
    // Our mock groqService returns movieData, which generateSummary should capture
    expect(result.ok).toBe(true);
  });
});
