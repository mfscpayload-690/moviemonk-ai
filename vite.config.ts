import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: process.env.GITHUB_ACTIONS ? '/moviemonk-ai/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'mock-api-middleware',
        configureServer(server) {
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
