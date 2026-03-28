import type { VercelResponse } from './vercel';

export function sendApiError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const includeDetails = process.env.NODE_ENV !== 'production' && typeof details !== 'undefined';

  return res.status(status).json({
    ok: false,
    error: message,
    error_code: code,
    ...(includeDetails ? { error_details: details } : {})
  });
}
