import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { parseVibeQuery } from '../services/queryParser';
import { pickGroqKey } from './_utils/groqKeys';
import type { VibeParseResult } from '../types';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

function buildSystemPrompt(): string {
  return [
    'You are a movie and TV natural-language query parser.',
    'Convert one user query into the exact JSON schema provided by the application.',
    'Return ONLY valid JSON. Do not wrap in markdown fences. Do not include extra keys.',
    'Preserve user intent. Extract hard filters only when explicit and testable.',
    'Use lowercase for arrays except person names and title names.',
    'Normalize language names to ISO-639-1 where possible.',
    'If unsure, lower confidence and keep constraints broad.',
  ].join(' ');
}

function buildUserPrompt(query: string): string {
  return `Parse this user query into the exact JSON schema below.\n\nQuery: ${query}\n\nSchema summary:\n- query_raw: string\n- intent_type: title_lookup | vibe_discovery | mixed\n- hard_constraints: include_genres, exclude_genres, languages, release_year_min, release_year_max, max_runtime_minutes, min_runtime_minutes, media_type, include_people, exclude_people\n- soft_preferences: tone_tags, story_cues, pace, intensity, reference_titles\n- ranking_hints: boost_overview_terms, boost_keyword_terms, penalize_terms\n- fallback_query_terms: string[]\n- confidence: number from 0.0 to 1.0\n- notes_for_retrieval: string[]\n\nImportant rules:\n- Preserve negations exactly: not, no, exclude, without.\n- If actor/director is named, place them in include_people and add a retrieval note.\n- Return strict JSON only.`;
}

function parseGroqJson(text: string): VibeParseResult | null {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as VibeParseResult;
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as VibeParseResult;
    } catch {
      return null;
    }
  }
  return null;
}

function fallbackParse(query: string): VibeParseResult {
  return parseVibeQuery(query);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/vibe');
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (!['GET', 'POST'].includes(req.method || '')) {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const input = req.method === 'POST' ? (req.body || {}) : req.query;
  const q = String(input.q || '').trim();

  if (!q) {
    obs.finish(400, { error_code: 'missing_query' });
    return sendApiError(res, 400, 'missing_query', 'Query is required');
  }

  const groqKey = pickGroqKey();
  if (!groqKey) {
    const parsed = fallbackParse(q);
    obs.finish(200, { intent_type: parsed.intent_type, provider: 'fallback' });
    return res.status(200).json(parsed);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(q) }
        ],
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Groq vibe parse failed:', response.status, errorText);
      const parsed = fallbackParse(q);
      obs.finish(200, { intent_type: parsed.intent_type, provider: 'fallback' });
      return res.status(200).json(parsed);
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const parsed = parseGroqJson(content) || fallbackParse(q);

    // Ensure the contract is always complete and stable.
    parsed.query_raw = parsed.query_raw || q;
    parsed.confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
    parsed.hard_constraints = parsed.hard_constraints || fallbackParse(q).hard_constraints;
    parsed.soft_preferences = parsed.soft_preferences || fallbackParse(q).soft_preferences;
    parsed.ranking_hints = parsed.ranking_hints || fallbackParse(q).ranking_hints;
    parsed.fallback_query_terms = parsed.fallback_query_terms || fallbackParse(q).fallback_query_terms;
    parsed.notes_for_retrieval = parsed.notes_for_retrieval || fallbackParse(q).notes_for_retrieval;

    obs.finish(200, { intent_type: parsed.intent_type, provider: 'groq' });
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.warn('Groq vibe parse exception:', error?.message || error);
    const parsed = fallbackParse(q);
    obs.finish(200, { intent_type: parsed.intent_type, provider: 'fallback' });
    return res.status(200).json(parsed);
  }
}
