/**
 * Secure OMDB API proxy - keeps API key server-side
 */
export {};
const { applyCors } = require('./_utils/cors');

module.exports = async function handler(req: any, res: any) {
  const provider = 'omdb';
  const sendError = (status: number, code: string, message: string, details?: any) => {
    return res.status(status).json({ error: { provider, code, message, details } });
  };
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');

  if (req.headers.origin && !originAllowed) {
    return sendError(403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return sendError(405, 'method_not_allowed', 'Only GET supported');
  }

  const { i: imdbId } = req.query;

  if (!imdbId || typeof imdbId !== 'string') {
    return sendError(400, 'missing_imdb_id', 'Missing IMDB ID parameter (i)');
  }

  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (!OMDB_API_KEY) {
    return sendError(400, 'missing_api_key', 'OMDB API key not configured');
  }

  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OMDB API error:', response.status, errorText);
      return sendError(response.status, 'upstream_error', `OMDB API error ${response.status}`, errorText);
    }

    const data: any = await response.json();
    
    // OMDB returns Response: "False" on error
    if (data.Response === 'False') {
      return sendError(404, 'not_found', 'OMDB not found', data.Error || 'Unknown error');
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('OMDB proxy error:', error);
    return sendError(500, 'proxy_error', 'OMDB proxy request failed', error.message);
  }
}
