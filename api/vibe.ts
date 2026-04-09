import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';
import { parseVibeQuery } from '../services/queryParser';

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

  const parsed = parseVibeQuery(q);
  obs.finish(200, { intent_type: parsed.intent_type });
  return res.status(200).json(parsed);
}
