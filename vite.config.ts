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
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
    ],
    define: {
      // Safe defines (if any)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-motion': ['framer-motion'],
            'vendor-analytics': ['@vercel/analytics', '@vercel/speed-insights'],
          }
        }
      }
    }
  };
});
