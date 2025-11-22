/**
 * Secure OMDB API proxy - keeps API key server-side
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

  const { i: imdbId } = req.query;

  if (!imdbId || typeof imdbId !== 'string') {
    return res.status(400).json({ error: 'Missing IMDB ID parameter (i)' });
  }

  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (!OMDB_API_KEY) {
    return res.status(500).json({ error: 'OMDB API key not configured' });
  }

  try {
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OMDB API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `OMDB API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // OMDB returns Response: "False" on error
    if (data.Response === 'False') {
      return res.status(404).json({
        error: 'OMDB not found',
        details: data.Error || 'Unknown error'
      });
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error('OMDB proxy error:', error);
    return res.status(500).json({
      error: 'OMDB proxy request failed',
      details: error.message
    });
  }
}
