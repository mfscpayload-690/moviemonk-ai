/**
 * Secure TMDB API proxy - keeps API key server-side
 */
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint } = req.query;

  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;

  if (!TMDB_API_KEY && !TMDB_READ_TOKEN) {
    return res.status(500).json({ error: 'TMDB credentials not configured' });
  }

  try {
    // Build TMDB URL
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    
    // Forward query params (except endpoint)
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'endpoint' && value) {
        url.searchParams.set(key, String(value));
      }
    });

    // Add API key if using v3
    if (TMDB_API_KEY) {
      url.searchParams.set('api_key', TMDB_API_KEY);
    }

    // Use Bearer token for v4 or fallback to v3
    const headers: HeadersInit = TMDB_READ_TOKEN
      ? { Authorization: `Bearer ${TMDB_READ_TOKEN}` }
      : {};

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `TMDB API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('TMDB proxy error:', error);
    return res.status(500).json({
      error: 'TMDB proxy request failed',
      details: error.message
    });
  }
}
