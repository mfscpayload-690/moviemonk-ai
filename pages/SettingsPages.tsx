import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, InfoIcon } from '../components/icons';
import {
  DEFAULT_PREFERENCE_SETTINGS,
  DEFAULT_PROFILE_SETTINGS,
  loadPreferenceSettings,
  loadProfileSettings,
  savePreferenceSettings,
  saveProfileSettings,
  UserPreferenceSettings,
  UserProfileSettings
} from '../lib/userSettings';
import {
  fetchPreferenceSettings,
  fetchProfileSettings,
  upsertPreferenceSettings,
  upsertProfileSettings
} from '../services/userSettingsService';

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country' },
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'BR', label: 'Brazil' }
];

const GENRE_OPTIONS = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Fantasy',
  'History',
  'Horror',
  'Mystery',
  'Romance',
  'Family',
  'Science Fiction',
  'Thriller',
  'War'
];

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Malayalam',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Tamil',
  'Telugu',
  'Portuguese'
];

const DECADE_OPTIONS = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
const REGION_OPTIONS = ['Hollywood', 'Bollywood', 'K-drama', 'Anime', 'European', 'Latin American', 'Mollywood', 'South Indian'];

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '1rem',
  background: 'rgba(255,255,255,0.04)'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.2)',
  color: '#fff',
  padding: '0.6rem 0.75rem'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  marginBottom: '0.75rem'
};

function SettingsLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-container">
      <header className="app-header flex items-center justify-between px-4 sm:px-6 py-3.5 glass-panel border-b-0 z-50">
        <Link to="/" className="text-white font-bold">MovieMonk</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/settings" className="text-brand-text-light hover:text-white">Settings</Link>
          <Link to="/settings/profile" className="text-brand-text-light hover:text-white">Profile</Link>
          <Link to="/settings/preferences" className="text-brand-text-light hover:text-white">Preferences</Link>
          <Link to="/" className="text-brand-text-light hover:text-white">Home</Link>
        </nav>
      </header>
      <main className="main-content px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}

async function syncSettingsFromCloud(
  userId: string,
  setProfile: (value: UserProfileSettings) => void,
  setPrefs: (value: UserPreferenceSettings) => void
) {
  try {
    const [profile, prefs] = await Promise.all([
      fetchProfileSettings(userId),
      fetchPreferenceSettings(userId)
    ]);
    setProfile(profile);
    setPrefs(prefs);
    saveProfileSettings(profile);
    savePreferenceSettings(prefs);
  } catch {
    // Local fallback is already loaded.
  }
}

function useSettingsState() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileSettings>(DEFAULT_PROFILE_SETTINGS);
  const [preferences, setPreferences] = useState<UserPreferenceSettings>(DEFAULT_PREFERENCE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfileSettings());
    setPreferences(loadPreferenceSettings());
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void syncSettingsFromCloud(user.id, setProfile, setPreferences);
  }, [user?.id]);

  const saveAll = async (nextProfile: UserProfileSettings, nextPrefs: UserPreferenceSettings) => {
    setSaving(true);
    setSaveMessage(null);
    const normalizedPrefs: UserPreferenceSettings = {
      ...nextPrefs,
      notificationsEnabled: nextPrefs.notificationFrequency !== 'off' && nextPrefs.notificationChannels.length > 0
    };
    saveProfileSettings(nextProfile);
    savePreferenceSettings(normalizedPrefs);
    try {
      if (user?.id) {
        await Promise.all([
          upsertProfileSettings(user.id, nextProfile),
          upsertPreferenceSettings(user.id, normalizedPrefs)
        ]);
      }
      setSaveMessage('Saved successfully');
    } catch (error: any) {
      setSaveMessage(error?.message || 'Saved locally; cloud sync pending');
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    profile,
    preferences,
    setProfile,
    setPreferences,
    saveAll,
    saving,
    saveMessage
  };
}

function MultiSelectChips({
  values,
  options,
  onChange
}: {
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option);
        return (
          <button
            type="button"
            key={option}
            className={`px-3 py-1 rounded-full border text-sm ${active ? 'bg-brand-primary text-white border-brand-primary' : 'border-white/20 text-brand-text-light'}`}
            onClick={() => {
              if (active) {
                onChange(values.filter((entry) => entry !== option));
              } else {
                onChange([...values, option]);
              }
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SaveStatusMessage({ message }: { message: string }) {
  const isSuccess = message.toLowerCase().includes('saved successfully');

  return (
    <p className={`text-sm inline-flex items-center gap-2 leading-none ${isSuccess ? 'text-emerald-300' : 'text-brand-text-light'}`}>
      {isSuccess ? <CheckIcon className="w-4 h-4" /> : <InfoIcon className="w-4 h-4" />}
      <span>{message}</span>
    </p>
  );
}

export function SettingsHubPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <SettingsLayout title="Settings"><div className="text-center text-brand-text-light">Loading...</div></SettingsLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <SettingsLayout title="Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Profile Settings</h2>
          <p className="text-brand-text-light text-sm mb-3">Manage your account identity and profile details.</p>
          <Link to="/settings/profile" className="btn-primary inline-flex">Open profile settings</Link>
        </section>
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Preference Settings</h2>
          <p className="text-brand-text-light text-sm mb-3">Set your genres, languages, and app behavior for personalized discovery.</p>
          <Link to="/settings/preferences" className="btn-primary inline-flex">Open preference settings</Link>
        </section>
      </div>
    </SettingsLayout>
  );
}

export function ProfileSettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile, preferences, setProfile, saveAll, saving, saveMessage } = useSettingsState();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <SettingsLayout title="Profile Settings"><div className="text-center text-brand-text-light">Loading...</div></SettingsLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <SettingsLayout title="Profile Settings">
      <section style={cardStyle} className="space-y-3 max-w-2xl">
        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input
            style={inputStyle}
            value={profile.fullName}
            onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Sex</label>
          <select
            style={inputStyle}
            value={profile.sex}
            onChange={(event) => setProfile({ ...profile, sex: event.target.value as UserProfileSettings['sex'] })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Country</label>
          <select
            style={inputStyle}
            value={profile.countryCode}
            onChange={(event) => setProfile({ ...profile, countryCode: event.target.value })}
          >
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={() => void saveAll(profile, preferences)}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>

          {saveMessage && <SaveStatusMessage message={saveMessage} />}
        </div>
      </section>
    </SettingsLayout>
  );
}

export function PreferenceSettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile, preferences, setPreferences, saveAll, saving, saveMessage } = useSettingsState();

  const toggleNotificationChannel = (channel: 'in_app' | 'email' | 'push') => {
    const exists = preferences.notificationChannels.includes(channel);
    const nextChannels = exists
      ? preferences.notificationChannels.filter((entry) => entry !== channel)
      : [...preferences.notificationChannels, channel];

    const nextFrequency = nextChannels.length === 0 ? 'off' : preferences.notificationFrequency;

    setPreferences({
      ...preferences,
      notificationChannels: nextChannels,
      notificationFrequency: nextFrequency,
      notificationsEnabled: nextFrequency !== 'off' && nextChannels.length > 0
    });
  };

  const setNotificationFrequency = (frequency: UserPreferenceSettings['notificationFrequency']) => {
    const notificationsEnabled = frequency !== 'off' && preferences.notificationChannels.length > 0;
    setPreferences({
      ...preferences,
      notificationFrequency: frequency,
      notificationsEnabled
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <SettingsLayout title="Preference Settings"><div className="text-center text-brand-text-light">Loading...</div></SettingsLayout>;
  }

  if (!user) {
    return null;
  }

  return (
    <SettingsLayout title="Preference Settings">
      <section style={cardStyle} className="space-y-4">
        <div>
          <h2 style={sectionTitleStyle}>Favorite genres</h2>
          <MultiSelectChips
            values={preferences.genres}
            options={GENRE_OPTIONS}
            onChange={(genres) => setPreferences({ ...preferences, genres })}
          />
        </div>

        <div>
          <h2 style={sectionTitleStyle}>Preferred languages</h2>
          <MultiSelectChips
            values={preferences.languages}
            options={LANGUAGE_OPTIONS}
            onChange={(languages) => setPreferences({ ...preferences, languages })}
          />
        </div>

        <div>
          <h2 style={sectionTitleStyle}>Favorite decades</h2>
          <MultiSelectChips
            values={preferences.favoriteDecades}
            options={DECADE_OPTIONS}
            onChange={(favoriteDecades) => setPreferences({ ...preferences, favoriteDecades })}
          />
        </div>

        <div>
          <h2 style={sectionTitleStyle}>Favorite regions</h2>
          <MultiSelectChips
            values={preferences.favoriteRegions}
            options={REGION_OPTIONS}
            onChange={(favoriteRegions) => setPreferences({ ...preferences, favoriteRegions })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">Content mix</label>
            <select
              style={inputStyle}
              value={preferences.contentMix}
              onChange={(event) => setPreferences({ ...preferences, contentMix: event.target.value as UserPreferenceSettings['contentMix'] })}
            >
              <option value="balanced">Balanced</option>
              <option value="mostly_movies">Mostly Movies</option>
              <option value="mostly_series">Mostly Series</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Card density</label>
            <select
              style={inputStyle}
              value={preferences.cardDensity}
              onChange={(event) => setPreferences({ ...preferences, cardDensity: event.target.value as UserPreferenceSettings['cardDensity'] })}
            >
              <option value="rich">Rich</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.familySafe}
              onChange={(event) => setPreferences({ ...preferences, familySafe: event.target.checked })}
            />
            Family-safe feed mode
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.autoplayTrailers}
              onChange={(event) => setPreferences({ ...preferences, autoplayTrailers: event.target.checked })}
            />
            Autoplay trailers
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Notification channels</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'in_app', label: 'In-app' },
                { key: 'email', label: 'Email' },
                { key: 'push', label: 'Push' }
              ].map((option) => {
                const active = preferences.notificationChannels.includes(option.key as 'in_app' | 'email' | 'push');
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-sm ${active ? 'bg-brand-primary text-white border-brand-primary' : 'border-white/20 text-brand-text-light'}`}
                    onClick={() => toggleNotificationChannel(option.key as 'in_app' | 'email' | 'push')}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Notification frequency</label>
            <select
              style={inputStyle}
              value={preferences.notificationFrequency}
              onChange={(event) => setNotificationFrequency(event.target.value as UserPreferenceSettings['notificationFrequency'])}
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={() => void saveAll(profile, preferences)}
          >
            {saving ? 'Saving...' : 'Save preferences'}
          </button>

          {saveMessage && <SaveStatusMessage message={saveMessage} />}
        </div>
      </section>
    </SettingsLayout>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, preferences, setProfile, setPreferences, saveAll, saving, saveMessage } = useSettingsState();

  const canContinue = useMemo(() => profile.fullName.trim().length > 0, [profile.fullName]);

  return (
    <SettingsLayout title="Welcome to MovieMonk">
      <section style={cardStyle} className="space-y-4 max-w-3xl">
        <p className="text-brand-text-light text-sm">
          Complete your profile and preferences to unlock personalized discovery.
        </p>

        <div>
          <h2 style={sectionTitleStyle}>Pick at least 3 genres</h2>
          <MultiSelectChips
            values={preferences.genres}
            options={GENRE_OPTIONS}
            onChange={(genres) => setPreferences({ ...preferences, genres })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={!canContinue || saving}
            onClick={async () => {
              const nextProfile = { ...profile, onboardingCompleted: true };
              await saveAll(nextProfile, preferences);
              navigate('/');
            }}
          >
            {saving ? 'Saving...' : 'Finish onboarding'}
          </button>

          {saveMessage && <SaveStatusMessage message={saveMessage} />}
        </div>
      </section>
    </SettingsLayout>
  );
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const [waitCount, setWaitCount] = useState(0);

  useEffect(() => {
    // If still loading or user hasn't been populated yet, wait a bit
    if (loading || !user) {
      // Maximum 2 seconds wait for auth to complete
      if (waitCount < 20) {
        const timer = setTimeout(() => {
          setWaitCount(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
      // If we've waited long enough and still no user, redirect to home
      navigate('/', { replace: true });
      return;
    }

    // User is now confirmed logged in
    const localProfile = loadProfileSettings();
    navigate(localProfile.onboardingCompleted ? '/' : '/onboarding', { replace: true });
  }, [loading, user, navigate, waitCount]);

  return (
    <SettingsLayout title="Signing you in">
      <section style={cardStyle}>
        <p className="text-brand-text-light text-sm">Completing authentication and restoring your session...</p>
      </section>
    </SettingsLayout>
  );
}
