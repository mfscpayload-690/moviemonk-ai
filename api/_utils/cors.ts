import type { VercelRequest, VercelResponse } from '@vercel/node';

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function getAllowedOrigins(req: VercelRequest): Set<string> {
  const origins = new Set<string>(LOCAL_ORIGINS);

  const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const origin of envOrigins) {
    origins.add(origin);
  }

  const host = typeof req.headers.host === 'string' ? req.headers.host : '';
  if (host) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }

  return origins;
}

export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string
): { originAllowed: boolean } {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const allowedOrigins = getAllowedOrigins(req);
  const originAllowed = !origin || allowedOrigins.has(origin);

  if (origin && originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return { originAllowed };
}
