import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const getEnv = (key: string) => env[key] || process.env[key];
  return {
    base: process.env.GITHUB_ACTIONS ? '/moviemonk-ai/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'mock-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/tmdb', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '/api/tmdb', 'http://localhost:3000');
              const endpoint = requestUrl.searchParams.get('endpoint');

              if (!endpoint) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: { provider: 'tmdb', code: 'missing_endpoint', message: 'Missing endpoint parameter' } }));
                return;
              }

              const tmdbApiKey = getEnv('TMDB_API_KEY');
              const tmdbReadToken = getEnv('TMDB_READ_TOKEN');

              if (!tmdbApiKey && !tmdbReadToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: { provider: 'tmdb', code: 'missing_api_key', message: 'TMDB credentials not configured' } }));
                return;
              }

              const upstream = new URL(`https://api.themoviedb.org/3/${endpoint}`);
              requestUrl.searchParams.forEach((value, key) => {
                if (key !== 'endpoint') {
                  upstream.searchParams.set(key, value);
                }
              });

              if (tmdbApiKey) {
                upstream.searchParams.set('api_key', tmdbApiKey);
              }

              const headers = tmdbReadToken
                ? { Authorization: `Bearer ${tmdbReadToken}` }
                : undefined;

              const response = await fetch(upstream.toString(), { headers });
              const bodyText = await response.text();

              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(bodyText);
            } catch (error: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: { provider: 'tmdb', code: 'proxy_error', message: 'TMDB proxy request failed', details: error?.message || 'Unknown error' } }));
            }
          });

          server.middlewares.use('/api/query', (req, res) => {
            // Mock response for "Inception" to allow UI testing
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: true,
              type: 'movie',
              data: {
                movie: {
                  id: 27205,
                  title: 'Inception (Local Mock)',
                  year: '2010',
                  overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
                  genres: ['Action', 'Science Fiction', 'Adventure'],
                  poster_url: 'https://image.tmdb.org/t/p/w500/8Z8dptZQl1qPhQrJ4howsCorgw.jpg',
                  backdrop_url: 'https://image.tmdb.org/t/p/w780/s3TBrRGB1jav7fwSaGj7w94Gnin.jpg',
                  cast: [
                    { name: 'Leonardo DiCaprio', role: 'Dom Cobb' },
                    { name: 'Joseph Gordon-Levitt', role: 'Arthur' },
                    { name: 'Elliot Page', role: 'Ariadne' }
                  ],
                  crew: { director: 'Christopher Nolan', writer: 'Christopher Nolan', music: 'Hans Zimmer' }
                }
              },
              summary: {
                summary_short: 'This is a mocked response because the backend API is not running. The UI is working perfectly!',
                summary_long: 'This is a mocked response to demonstrate the UI capabilities without requiring the Vercel backend functions to be running. In production, this would fetch real data from TMDB and Perplexity.'
              },
              sources: [{ name: 'Local Mock', url: '#' }],
              cached: false
            }));
          });

          server.middlewares.use('/api/suggest', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '/api/suggest', 'http://localhost:3000');
              const q = requestUrl.searchParams.get('q') || '';

              if (q.length < 2) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, query: q, total: 0, suggestions: [] }));
                return;
              }

              const tmdbApiKey = getEnv('TMDB_API_KEY');
              const tmdbReadToken = getEnv('TMDB_READ_TOKEN');

              if (!tmdbApiKey && !tmdbReadToken) {
                // Return synthetic results when no API key is available
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  ok: true, query: q, total: 1,
                  suggestions: [{
                    id: 27205, title: q, year: '2024', type: 'movie',
                    media_type: 'movie', confidence: 0.95,
                    poster_url: 'https://image.tmdb.org/t/p/w154/8Z8dptZQl1qPhQrJ4howsCorgw.jpg'
                  }]
                }));
                return;
              }

              const upstream = new URL('https://api.themoviedb.org/3/search/multi');
              upstream.searchParams.set('query', q);
              upstream.searchParams.set('page', '1');
              upstream.searchParams.set('include_adult', 'false');
              if (tmdbApiKey) upstream.searchParams.set('api_key', tmdbApiKey);

              const headers: Record<string, string> = {};
              if (tmdbReadToken) headers['Authorization'] = `Bearer ${tmdbReadToken}`;

              const response = await fetch(upstream.toString(), { headers });
              const data: any = await response.json();
              const results = Array.isArray(data?.results) ? data.results.slice(0, 12) : [];

              const suggestions = results
                .filter((item: any) => item && ['movie', 'tv', 'person'].includes(item.media_type))
                .map((item: any) => ({
                  id: item.id,
                  title: item.title || item.name,
                  year: (item.release_date || item.first_air_date || '').slice(0, 4) || undefined,
                  type: item.media_type === 'tv' ? 'show' : item.media_type,
                  media_type: item.media_type,
                  confidence: 0.85,
                  poster_url: item.poster_path
                    ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
                    : item.profile_path
                      ? `https://image.tmdb.org/t/p/w154${item.profile_path}`
                      : undefined,
                  known_for_department: item.known_for_department,
                  known_for_titles: Array.isArray(item.known_for)
                    ? item.known_for.map((k: any) => k?.title || k?.name).filter(Boolean)
                    : undefined
                }));

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, query: q, total: suggestions.length, suggestions }));
            } catch (error: any) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, query: '', total: 0, suggestions: [] }));
            }
          });

          server.middlewares.use('/api/resolveEntity', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ type: 'movie', chosen: { id: 27205 } }));
          });

        }
      }
    ],
    define: {
      // Safe defines (if any)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
