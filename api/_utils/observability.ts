import type { VercelRequest, VercelResponse } from '@vercel/node';

type LogLevel = 'info' | 'warn' | 'error';

function createRequestId(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `req_${Date.now()}_${rnd}`;
}

export type RequestObserver = {
  requestId: string;
  route: string;
  log: (event: string, level?: LogLevel, data?: Record<string, unknown>) => void;
  finish: (status: number, data?: Record<string, unknown>) => void;
};

export function beginRequestObservation(
  req: VercelRequest,
  res: VercelResponse,
  route: string
): RequestObserver {
  const incoming = req.headers['x-request-id'];
  const requestId = typeof incoming === 'string' && incoming.trim() ? incoming : createRequestId();
  const start = Date.now();

  res.setHeader('X-Request-Id', requestId);

  const log = (event: string, level: LogLevel = 'info', data: Record<string, unknown> = {}) => {
    const line = {
      ts: new Date().toISOString(),
      level,
      route,
      request_id: requestId,
      event,
      ...data
    };
    const serialized = JSON.stringify(line);
    if (level === 'error') console.error(serialized);
    else if (level === 'warn') console.warn(serialized);
    else console.log(serialized);
  };

  log('request_start', 'info', {
    method: req.method,
    has_origin: Boolean(req.headers.origin)
  });

  const finish = (status: number, data: Record<string, unknown> = {}) => {
    log('request_end', status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', {
      status,
      duration_ms: Date.now() - start,
      ...data
    });
  };

  return { requestId, route, log, finish };
}