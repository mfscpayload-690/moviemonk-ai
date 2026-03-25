import type { VercelResponse } from '@vercel/node';

export function sendApiError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    ok: false,
    error: message,
    error_code: code,
    error_details: details
  });
}
