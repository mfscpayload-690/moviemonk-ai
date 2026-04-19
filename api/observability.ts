import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';
import { sendApiError } from './_utils/http';
import { beginRequestObservation } from './_utils/observability';

type EventPayload = {
  event: string;
  level?: 'info' | 'warn' | 'error';
  source?: string;
  data?: Record<string, unknown>;
  ts?: string;
};

function normalizePayload(input: unknown): EventPayload | null {
  if (typeof input === 'string') {
    try {
      return normalizePayload(JSON.parse(input));
    } catch {
      return null;
    }
  }
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const event = typeof raw.event === 'string' ? raw.event.trim() : '';
  if (!event) return null;
  const level = raw.level === 'warn' || raw.level === 'error' ? raw.level : 'info';
  const source = typeof raw.source === 'string' ? raw.source : 'client';
  const data = typeof raw.data === 'object' && raw.data !== null ? raw.data as Record<string, unknown> : {};
  const ts = typeof raw.ts === 'string' ? raw.ts : new Date().toISOString();
  return { event, level, source, data, ts };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const obs = beginRequestObservation(req, res, '/api/observability');
  const { originAllowed } = applyCors(req, res, 'POST, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    obs.finish(403, { reason: 'forbidden_origin' });
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }

  if (req.method === 'OPTIONS') {
    obs.finish(204, { reason: 'preflight' });
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    obs.finish(405, { error_code: 'method_not_allowed' });
    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  }

  const payload = normalizePayload(req.body);
  if (!payload) {
    obs.finish(400, { error_code: 'invalid_payload' });
    return sendApiError(res, 400, 'invalid_payload', 'Invalid observability payload');
  }

  obs.log('client_event_ingested', payload.level || 'info', {
    source: payload.source,
    event: payload.event,
    ...(payload.data || {})
  });

  obs.finish(202, { event: payload.event });
  return res.status(202).json({ ok: true });
}
