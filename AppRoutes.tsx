import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import UserPreferenceEffects from './components/UserPreferenceEffects';
import ClientObservabilityEffects from './components/ClientObservabilityEffects';
import { ErrorBoundary } from './components/ErrorBoundary';

const App = lazy(() => import('./App-Responsive'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const WatchlistsDashboard = lazy(() =>
  import('./pages/WatchlistsDashboard').then((module) => ({ default: module.WatchlistsDashboard }))
);
const SharedWatchlistView = lazy(() =>
  import('./components/SharedWatchlistView').then((module) => ({ default: module.SharedWatchlistView }))
);
const SettingsHubPage = lazy(() =>
  import('./pages/SettingsPages').then((module) => ({ default: module.SettingsHubPage }))
);
const ProfileSettingsPage = lazy(() =>
  import('./pages/SettingsPages').then((module) => ({ default: module.ProfileSettingsPage }))
);
const PreferenceSettingsPage = lazy(() =>
  import('./pages/SettingsPages').then((module) => ({ default: module.PreferenceSettingsPage }))
);
const AuthCallbackPage = lazy(() =>
  import('./pages/SettingsPages').then((module) => ({ default: module.AuthCallbackPage }))
);
const OnboardingPage = lazy(() =>
  import('./pages/SettingsPages').then((module) => ({ default: module.OnboardingPage }))
);

export default function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg text-brand-text-light flex items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <UserPreferenceEffects />
      <ClientObservabilityEffects />
      <Routes>
        <Route path="/" element={<ErrorBoundary key={location.pathname}><App /></ErrorBoundary>} />
        <Route path="/search" element={<ErrorBoundary key={location.pathname}><App /></ErrorBoundary>} />
        <Route path="/movie/:id" element={<ErrorBoundary key={location.pathname}><App /></ErrorBoundary>} />
        <Route path="/tv/:id" element={<ErrorBoundary key={location.pathname}><App /></ErrorBoundary>} />
        <Route path="/person/:id" element={<ErrorBoundary key={location.pathname}><App /></ErrorBoundary>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/watchlists" element={<ErrorBoundary key={location.pathname}><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/watched" element={<ErrorBoundary key={location.pathname}><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/:folderName" element={<ErrorBoundary key={location.pathname}><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/share" element={<SharedWatchlistView />} />
        <Route path="/watchlists/share/:token" element={<SharedWatchlistView />} />
        <Route path="/settings" element={<ErrorBoundary key={location.pathname}><SettingsHubPage /></ErrorBoundary>} />
        <Route path="/settings/profile" element={<ErrorBoundary key={location.pathname}><ProfileSettingsPage /></ErrorBoundary>} />
        <Route path="/settings/preferences" element={<ErrorBoundary key={location.pathname}><PreferenceSettingsPage /></ErrorBoundary>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
