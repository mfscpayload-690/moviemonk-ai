import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
        <Route path="/" element={<ErrorBoundary><App /></ErrorBoundary>} />
        <Route path="/search" element={<ErrorBoundary><App /></ErrorBoundary>} />
        <Route path="/movie/:id" element={<ErrorBoundary><App /></ErrorBoundary>} />
        <Route path="/tv/:id" element={<ErrorBoundary><App /></ErrorBoundary>} />
        <Route path="/person/:id" element={<ErrorBoundary><App /></ErrorBoundary>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/watchlists" element={<ErrorBoundary><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/watched" element={<ErrorBoundary><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/:folderName" element={<ErrorBoundary><WatchlistsDashboard /></ErrorBoundary>} />
        <Route path="/watchlists/share" element={<SharedWatchlistView />} />
        <Route path="/watchlists/share/:token" element={<SharedWatchlistView />} />
        <Route path="/settings" element={<ErrorBoundary><SettingsHubPage /></ErrorBoundary>} />
        <Route path="/settings/profile" element={<ErrorBoundary><ProfileSettingsPage /></ErrorBoundary>} />
        <Route path="/settings/preferences" element={<ErrorBoundary><PreferenceSettingsPage /></ErrorBoundary>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
