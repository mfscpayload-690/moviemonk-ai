import './src/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HelmetProvider } from 'react-helmet-async';
import './styles/modern.css';
import './styles/dynamic-search-island.css';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';

function injectPreconnectHints() {
  const urls = [
    import.meta.env.VITE_API_BASE_URL,
    import.meta.env.VITE_SUPABASE_URL
  ].filter(Boolean);

  urls.forEach(urlStr => {
    try {
      const origin = new URL(urlStr).origin;
      
      // Preconnect
      if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
      }
      
      // DNS Prefetch
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = origin;
        document.head.appendChild(link);
      }
    } catch (e) {
      // Ignore if parsing fails
    }
  });
}

try {
  injectPreconnectHints();
} catch (err) {
  console.warn('[Performance] Failed to inject preconnect hints:', err);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
    {/* Only track in production to keep dev data clean */}
    {import.meta.env.PROD && <Analytics />}
    {import.meta.env.PROD && <SpeedInsights />}
  </React.StrictMode>
);
