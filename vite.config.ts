import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: process.env.GITHUB_ACTIONS ? '/moviemonk-ai/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || ''),
        'process.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY || ''),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || ''),
        'process.env.TMDB_API_KEY': JSON.stringify(env.TMDB_API_KEY || ''),
        'process.env.TMDB_READ_TOKEN': JSON.stringify(env.TMDB_READ_TOKEN || ''),
        'process.env.PERPLEXITY_API_KEY': JSON.stringify(env.PERPLEXITY_API_KEY || ''),
        'process.env.OMDB_API_KEY': JSON.stringify(env.OMDB_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
