import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import App from './App-Responsive';
import {
  AuthCallbackPage,
  OnboardingPage,
  PreferenceSettingsPage,
  ProfileSettingsPage,
  SettingsHubPage
} from './pages/SettingsPages';
import { WatchlistsDashboard } from './pages/WatchlistsDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/search" element={<App />} />
      <Route path="/movie/:id" element={<App />} />
      <Route path="/tv/:id" element={<App />} />
      <Route path="/person/:id" element={<App />} />
      <Route path="/watchlists" element={<WatchlistsDashboard />} />
      <Route path="/watchlists/:folderName" element={<WatchlistsDashboard />} />
      <Route path="/settings" element={<SettingsHubPage />} />
      <Route path="/settings/profile" element={<ProfileSettingsPage />} />
      <Route path="/settings/preferences" element={<PreferenceSettingsPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
