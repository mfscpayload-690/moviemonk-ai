import { ChatMessage, QueryComplexity } from '../types';
import { fetchMovieData as fetchFromGroq } from './groqService';
import { fetchMovieData as fetchFromMistral } from './mistralService';
import { fetchMovieData as fetchFromOpenRouter } from './openrouterService';

export type Provider = 'groq' | 'mistral' | 'openrouter';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then((v) => { clearTimeout(id); resolve(v); }).catch((e) => { clearTimeout(id); reject(e); });
  });
}

export function parseJsonResponse<T = any>(raw: string): T | null {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '');
    // Try direct parse
    return JSON.parse(cleaned) as T;
  } catch {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export async function generateSummary(args: {
  evidence: string;
  query: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
  preferred?: Provider;
  chatHistory?: ChatMessage[];
}): Promise<{ ok: true; json: any; provider: Provider } | { ok: false; error: string } > {
  const { evidence, query, schema, timeoutMs = 10000, preferred, chatHistory } = args;

  const system = `You are a film expert. Produce strictly valid JSON only. Match the schema exactly. Do not include markdown fences.`;
  const user = `Using the evidence below, write a concise brief about the subject. Return ONLY JSON matching this schema keys: ${Object.keys(schema).join(', ')}.

Query: ${query}

Evidence:
${evidence}
`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  const order: Provider[] = preferred ? [preferred, 'groq', 'mistral', 'openrouter'].filter((v, i, a) => a.indexOf(v) === i) as Provider[] : ['groq', 'mistral', 'openrouter'];
  const start = Date.now();
  for (const prov of order) {
    const elapsed = Date.now() - start;
    const remaining = timeoutMs - elapsed;
    if (remaining <= 400) return { ok: false, error: 'Timeout: no provider responded' };

    try {
      let call: Promise<any>;
      if (prov === 'groq') call = fetchFromGroq(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);
      else if (prov === 'mistral') call = fetchFromMistral(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);
      else call = fetchFromOpenRouter(JSON.stringify({ schema, messages }), QueryComplexity.SIMPLE, chatHistory);

      const result = await withTimeout(call, Math.max(1000, remaining), `${prov} summary`);
      const content = result?.movieData ? JSON.stringify(result.movieData) : result?.error ? '' : '';
      // Prefer model JSON body if it returned a movieData-like payload
      const raw = content && content !== '{}' ? content : (result?.choices?.[0]?.message?.content || '');
      const parsed = raw ? parseJsonResponse(raw) : result?.movieData || null;
      if (parsed && typeof parsed === 'object') {
        return { ok: true, json: parsed, provider: prov };
      }
    } catch (e: any) {
      continue;
    }
  }
  return { ok: false, error: 'All providers failed' };
}
