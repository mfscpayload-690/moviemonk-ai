import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import UserPreferenceEffects from './components/UserPreferenceEffects';

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
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<App />} />
        <Route path="/movie/:id" element={<App />} />
        <Route path="/tv/:id" element={<App />} />
        <Route path="/person/:id" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/watchlists" element={<WatchlistsDashboard />} />
        <Route path="/watchlists/:folderName" element={<WatchlistsDashboard />} />
        <Route path="/watchlists/share" element={<SharedWatchlistView />} />
        <Route path="/watchlists/share/:token" element={<SharedWatchlistView />} />
        <Route path="/settings" element={<SettingsHubPage />} />
        <Route path="/settings/profile" element={<ProfileSettingsPage />} />
        <Route path="/settings/preferences" element={<PreferenceSettingsPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
