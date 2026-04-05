
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './styles/modern.css';
import './styles/dynamic-search-island.css';
import './styles/filter-panel.css';
import './styles/shared-watchlist.css';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
    {/* Only track in production to keep dev data clean */}
    {import.meta.env.PROD && <Analytics />}
    {import.meta.env.PROD && <SpeedInsights />}
  </React.StrictMode>
);
