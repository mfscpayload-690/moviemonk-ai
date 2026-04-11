import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckIcon, InfoIcon, StarIcon, BellIcon, ChevronRightIcon, ShieldIcon, TrashIcon, ClockIcon, GlobeIcon } from '../components/icons';
import logoUrl from '../asset/android-chrome-192x192.png';

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

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

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
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Fantasy', 'History', 'Horror', 'Mystery', 'Romance',
  'Family', 'Science Fiction', 'Thriller', 'War'
];

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Malayalam', 'Spanish', 'French', 'German',
  'Japanese', 'Korean', 'Tamil', 'Telugu', 'Portuguese'
];

const DECADE_OPTIONS = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
const REGION_OPTIONS = ['Hollywood', 'Bollywood', 'K-drama', 'Anime', 'European', 'Latin American', 'Mollywood', 'South Indian'];

const APP_VERSION = '2.8.0';

/* ────────────────────────────────────────────
   Shared hooks & helpers
   ──────────────────────────────────────────── */

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
    const normalizedPrefs: UserPreferenceSettings = nextPrefs;
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

  return { user, profile, preferences, setProfile, setPreferences, saveAll, saving, saveMessage };
}

/* ────────────────────────────────────────────
   Reusable tiny components
   ──────────────────────────────────────────── */

function SettingsLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-container" style={{ background: '#121212' }}>
      <header className="app-header flex items-center justify-between px-4 sm:px-6 py-3 glass-panel border-b-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="MovieMonk" className="w-8 h-8" />
          <span className="text-white font-bold text-[15px] tracking-tight">MovieMonk</span>
        </Link>
        <button type="button" className="mm-settings-nav-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Back to app
        </button>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function SubPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-container" style={{ background: '#121212' }}>
      <header className="app-header flex items-center justify-between px-4 sm:px-6 py-3 glass-panel border-b-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="MovieMonk" className="w-8 h-8" />
          <span className="text-white font-bold text-[15px] tracking-tight">MovieMonk</span>
        </Link>
      </header>
      <div className="mm-settings-panel-header">
        <button type="button" className="mm-settings-nav-back" onClick={() => navigate('/settings')}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Settings
        </button>
        <span className="mm-settings-panel-title">{title}</span>
      </div>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function Chevron() {
  return (
    <span className="mm-settings-chevron">
      <ChevronRightIcon className="w-3.5 h-3.5" />
    </span>
  );
}

function SaveStatusMessage({ message }: { message: string }) {
  const isSuccess = message.toLowerCase().includes('saved successfully');
  return (
    <p className={`text-sm inline-flex items-center gap-2 leading-none mt-2 ${isSuccess ? 'text-emerald-300' : 'text-brand-text-light'}`}>
      {isSuccess ? <CheckIcon className="w-4 h-4" /> : <InfoIcon className="w-4 h-4" />}
      <span>{message}</span>
    </p>
  );
}

function getInitial(name?: string, email?: string): string {
  if (name && name.trim()) return name.trim()[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function getAvatarUrl(user: any, profile?: UserProfileSettings): string | null {
  return profile?.avatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
}

function Avatar({ user, profile, size }: { user: any; profile?: UserProfileSettings; size?: 'lg' }) {
  const url = getAvatarUrl(user, profile);
  const name = profile?.fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const email = user?.email || '';
  const cls = `mm-settings-avatar${size === 'lg' ? ' lg' : ''}`;

  if (url) {
    return (
      <div className={cls} style={{ padding: 0, overflow: 'hidden' }}>
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      </div>
    );
  }
  return <div className={cls}>{getInitial(name, email)}</div>;
}

function getProviderLabel(user: any): string {
  const provider = user?.app_metadata?.provider || user?.app_metadata?.providers?.[0] || '';
  if (provider === 'github') return 'GitHub account';
  if (provider === 'google') return 'Google account';
  return 'Email account';
}

/* ────────────────────────────────────────────
   HUB PAGE — /settings
   ──────────────────────────────────────────── */

export function SettingsHubPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<UserPreferenceSettings>(DEFAULT_PREFERENCE_SETTINGS);
  const [profile, setProfile] = useState<UserProfileSettings>(DEFAULT_PROFILE_SETTINGS);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setProfile(loadProfileSettings());
    setPreferences(loadPreferenceSettings());
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void syncSettingsFromCloud(user.id, setProfile, setPreferences);
  }, [user?.id]);

  const handleClearHistory = useCallback(async () => {
    if (window.confirm('Clear all search history? This cannot be undone.')) {
      if (!user?.id) return;
      try {
        await supabase.from('search_history').delete().eq('user_id', user.id);
        window.alert('Search history cleared.');
      } catch (e) {
        window.alert('Error clearing search history.');
      }
    }
  }, [user?.id]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmName = window.prompt('Type DELETE to permanently delete your account and all data.');
    if (confirmName === 'DELETE') {
      try {
        const { error } = await supabase.rpc('delete_user_account');
        if (error) throw error;
        await signOut();
        navigate('/', { replace: true });
        window.alert('Account successfully deleted.');
      } catch (err: any) {
        window.alert(err?.message || 'Failed to delete account.');
      }
    }
  }, [signOut, navigate]);

  const handleSignOut = useCallback(async () => {
    if (window.confirm('Sign out of MovieMonk?')) {
      try {
        await signOut();
        navigate('/', { replace: true });
      } catch {
        // handled by auth context
      }
    }
  }, [signOut, navigate]);

  if (loading) {
    return <SettingsLayout><div className="mm-settings-body"><p className="text-sm text-brand-text-light text-center">Loading...</p></div></SettingsLayout>;
  }

  if (!user) return null;

  const displayName = profile.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const email = user.email || '';
  const genreCount = preferences.genres.length;
  const isCloudSync = Boolean(user.id);

  return (
    <SettingsLayout>
      <div className="mm-settings-body">
        {/* Hero */}
        <div className="mm-settings-hero-top">
          <Avatar user={user} profile={profile} />
          <div>
            <div className="mm-settings-hero-name">{displayName || 'MovieMonk User'}</div>
            <div className="mm-settings-hero-email">{email}</div>
            <div className="mm-settings-badge">
              <span className="mm-settings-badge-dot" />
              {getProviderLabel(user)}
            </div>
          </div>
        </div>

        <div className="mm-settings-grid">
          {/* Left column */}
          <div className="mm-settings-grid-col">
            {/* Account */}
            <div className="mm-settings-section-label">Account</div>
            <div className="mm-settings-group">
              <button type="button" className="mm-settings-row" onClick={() => navigate('/settings/profile')}>
                <div className="mm-settings-row-icon mm-icon-purple">
                  <svg fill="none" stroke="#AFA9EC" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Profile</div>
                  <div className="mm-settings-row-sub">Display name, sex, country</div>
                </div>
                <div className="mm-settings-row-right"><Chevron /></div>
              </button>

            </div>

            {/* Discovery */}
            <div className="mm-settings-section-label">Discovery</div>
            <div className="mm-settings-group">
              <button type="button" className="mm-settings-row" onClick={() => navigate('/settings/preferences')}>
                <div className="mm-settings-row-icon mm-icon-teal" style={{ color: '#5DCAA5' }}>
                  <StarIcon className="w-4 h-4" />
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Preferences</div>
                  <div className="mm-settings-row-sub">Genres, languages, content type</div>
                </div>
                <div className="mm-settings-row-right">
                  {genreCount > 0 && <span className="mm-settings-pill mm-pill-purple">{genreCount} genre{genreCount !== 1 ? 's' : ''}</span>}
                  <Chevron />
                </div>
              </button>
              <div className="mm-settings-row" style={{ cursor: 'default' }}>
                <div className="mm-settings-row-icon mm-icon-amber" style={{ color: '#EF9F27' }}>
                  <GlobeIcon className="w-4 h-4" />
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Content mix</div>
                  <div className="mm-settings-row-sub">
                    {preferences.contentMix === 'balanced' ? 'Balanced mix' : preferences.contentMix === 'mostly_movies' ? 'Mostly movies' : 'Mostly series'}
                  </div>
                </div>
                <div className="mm-settings-row-right">
                  <span className="mm-settings-pill mm-pill-gray">
                    {preferences.contentMix === 'balanced' ? 'Balanced' : preferences.contentMix === 'mostly_movies' ? 'Movies' : 'Series'}
                  </span>
                </div>
              </div>
              <div className="mm-settings-row" style={{ cursor: 'default' }}>
                <div className="mm-settings-row-icon mm-icon-blue" style={{ color: '#85B7EB' }}>
                  <ShieldIcon className="w-4 h-4" />
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Family-safe mode</div>
                  <div className="mm-settings-row-sub">Filter explicit content from discovery</div>
                </div>
                <div className="mm-settings-row-right">
                  <span className={`mm-settings-pill ${preferences.familySafe ? 'mm-pill-green' : 'mm-pill-gray'}`}>
                    {preferences.familySafe ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="mm-settings-grid-col">
            {/* Data & Privacy */}
            <div className="mm-settings-section-label">Data &amp; privacy</div>
            <div className="mm-settings-group">
              <div className="mm-settings-row" style={{ cursor: 'default' }}>
                <div className="mm-settings-row-icon mm-icon-teal">
                  <svg fill="none" stroke="#5DCAA5" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Watchlist sync</div>
                  <div className="mm-settings-row-sub">Auto-sync to cloud</div>
                </div>
                <div className="mm-settings-row-right">
                  <button type="button" className={`mm-settings-toggle ${isCloudSync ? 'on' : ''}`} aria-label="Watchlist sync status" style={{ pointerEvents: 'none' }} />
                </div>
              </div>
              <button type="button" className="mm-settings-row" onClick={handleClearHistory}>
                <div className="mm-settings-row-icon mm-icon-amber" style={{ color: '#EF9F27' }}>
                  <ClockIcon className="w-4 h-4" />
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Search history</div>
                  <div className="mm-settings-row-sub">Stored locally on device</div>
                </div>
                <div className="mm-settings-row-right">
                  <span style={{ fontSize: 12, color: '#EF9F27' }}>Clear</span>
                </div>
              </button>
              <button type="button" className="mm-settings-row" onClick={handleSignOut}>
                <div className="mm-settings-row-icon mm-icon-purple">
                  <svg fill="none" stroke="#AFA9EC" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-row-title">Sign out</div>
                  <div className="mm-settings-row-sub">Log out of your account</div>
                </div>
                <div className="mm-settings-row-right"><Chevron /></div>
              </button>
            </div>

            {/* Danger zone */}
            <div className="mm-settings-section-label">Danger zone</div>
            <div style={{ marginBottom: 20 }}>
              <button type="button" className="mm-settings-danger-row" onClick={handleDeleteAccount}>
                <div className="mm-settings-row-icon mm-icon-red" style={{ color: '#E24B4A' }}>
                  <TrashIcon className="w-4 h-4" />
                </div>
                <div className="mm-settings-row-text">
                  <div className="mm-settings-danger-title">Delete account</div>
                  <div className="mm-settings-danger-sub">Permanently remove all your data</div>
                </div>
              </button>
            </div>

            <div className="mm-settings-version">MovieMonk v{APP_VERSION} · MIT License</div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

/* ────────────────────────────────────────────
   PROFILE PAGE — /settings/profile
   ──────────────────────────────────────────── */

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
    return <SubPageLayout title="Profile"><div className="mm-settings-body"><p className="text-sm text-brand-text-light text-center">Loading...</p></div></SubPageLayout>;
  }

  if (!user) return null;

  const displayName = profile.fullName || user.user_metadata?.full_name || '';
  const email = user.email || '';

  return (
    <SubPageLayout title="Profile">
      <div className="mm-settings-body">
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Avatar user={user} profile={profile} size="lg" />
        </div>

        <div className="mm-settings-field">
          <label>Full name</label>
          <input
            className="mm-settings-input"
            type="text"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div className="mm-settings-field">
          <label>Sex</label>
          <select
            className="mm-settings-input"
            value={profile.sex}
            onChange={(e) => setProfile({ ...profile, sex: e.target.value as UserProfileSettings['sex'] })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        <div className="mm-settings-field">
          <label>Country</label>
          <select
            className="mm-settings-input"
            value={profile.countryCode}
            onChange={(e) => setProfile({ ...profile, countryCode: e.target.value })}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="mm-settings-save-btn"
          disabled={saving}
          onClick={() => void saveAll(profile, preferences)}
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
        {saveMessage && <SaveStatusMessage message={saveMessage} />}
      </div>
    </SubPageLayout>
  );
}

/* ────────────────────────────────────────────
   PREFERENCES PAGE — /settings/preferences
   ──────────────────────────────────────────── */

export function PreferenceSettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { profile, preferences, setPreferences, saveAll, saving, saveMessage } = useSettingsState();

  const toggleGenre = (genre: string) => {
    const next = preferences.genres.includes(genre)
      ? preferences.genres.filter((g) => g !== genre)
      : [...preferences.genres, genre];
    setPreferences({ ...preferences, genres: next });
  };

  const toggleLanguage = (lang: string) => {
    const next = preferences.languages.includes(lang)
      ? preferences.languages.filter((l) => l !== lang)
      : [...preferences.languages, lang];
    setPreferences({ ...preferences, languages: next });
  };

  const toggleDecade = (decade: string) => {
    const next = preferences.favoriteDecades.includes(decade)
      ? preferences.favoriteDecades.filter((d) => d !== decade)
      : [...preferences.favoriteDecades, decade];
    setPreferences({ ...preferences, favoriteDecades: next });
  };

  const toggleRegion = (region: string) => {
    const next = preferences.favoriteRegions.includes(region)
      ? preferences.favoriteRegions.filter((r) => r !== region)
      : [...preferences.favoriteRegions, region];
    setPreferences({ ...preferences, favoriteRegions: next });
  };


  const setContentMix = (mix: UserPreferenceSettings['contentMix']) => {
    setPreferences({ ...preferences, contentMix: mix });
  };

  const setCardDensity = (density: UserPreferenceSettings['cardDensity']) => {
    setPreferences({ ...preferences, cardDensity: density });
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <SubPageLayout title="Preferences"><div className="mm-settings-body"><p className="text-sm text-brand-text-light text-center">Loading...</p></div></SubPageLayout>;
  }

  if (!user) return null;

  return (
    <SubPageLayout title="Preferences">
      <div className="mm-settings-body">
        {/* Genres */}
        <div className="mm-settings-field">
          <label>Favorite genres</label>
          <div className="mm-settings-genre-grid">
            {GENRE_OPTIONS.map((genre) => (
              <button
                type="button"
                key={genre}
                className={`mm-settings-genre-pill ${preferences.genres.includes(genre) ? 'sel' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="mm-settings-field">
          <label>Content languages</label>
          {LANGUAGE_OPTIONS.map((lang) => {
            const active = preferences.languages.includes(lang);
            return (
              <div key={lang} className="mm-settings-lang-row" onClick={() => toggleLanguage(lang)}>
                <span style={{ fontSize: 14, color: '#f3f4f6' }}>{lang}</span>
                <div className={`mm-settings-lang-check ${active ? 'on' : ''}`}>
                  {active && (
                    <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Decades */}
        <div className="mm-settings-field">
          <label>Favorite decades</label>
          <div className="mm-settings-genre-grid">
            {DECADE_OPTIONS.map((decade) => (
              <button
                type="button"
                key={decade}
                className={`mm-settings-genre-pill ${preferences.favoriteDecades.includes(decade) ? 'sel' : ''}`}
                onClick={() => toggleDecade(decade)}
              >
                {decade}
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="mm-settings-field">
          <label>Favorite regions</label>
          <div className="mm-settings-genre-grid">
            {REGION_OPTIONS.map((region) => (
              <button
                type="button"
                key={region}
                className={`mm-settings-genre-pill ${preferences.favoriteRegions.includes(region) ? 'sel' : ''}`}
                onClick={() => toggleRegion(region)}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Content mix */}
        <div className="mm-settings-field">
          <label>Content mix</label>
          <div className="mm-settings-select-group">
            {([['balanced', 'Balanced'], ['mostly_movies', 'Mostly Movies'], ['mostly_series', 'Mostly Series']] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`mm-settings-select-row ${preferences.contentMix === value ? 'sel' : ''}`}
                onClick={() => setContentMix(value)}
              >
                <span style={{ fontSize: 14, color: '#f3f4f6' }}>{label}</span>
                <div className={`mm-settings-radio ${preferences.contentMix === value ? 'on' : ''}`}>
                  {preferences.contentMix === value && <div className="mm-settings-radio-dot" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card density */}
        <div className="mm-settings-field">
          <label>Card density</label>
          <div className="mm-settings-select-group">
            {([['rich', 'Rich — more detail per card'], ['compact', 'Compact — more cards visible']] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={`mm-settings-select-row ${preferences.cardDensity === value ? 'sel' : ''}`}
                onClick={() => setCardDensity(value)}
              >
                <span style={{ fontSize: 14, color: '#f3f4f6' }}>{label}</span>
                <div className={`mm-settings-radio ${preferences.cardDensity === value ? 'on' : ''}`}>
                  {preferences.cardDensity === value && <div className="mm-settings-radio-dot" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="mm-settings-field">
          <label>Behavior</label>
          <div className="mm-settings-group">
            <div className="mm-settings-row" style={{ cursor: 'default' }}>
              <div className="mm-settings-row-text">
                <div className="mm-settings-row-title">Family-safe feed</div>
                <div className="mm-settings-row-sub">Filter explicit content</div>
              </div>
              <button
                type="button"
                className={`mm-settings-toggle ${preferences.familySafe ? 'on' : ''}`}
                onClick={() => setPreferences({ ...preferences, familySafe: !preferences.familySafe })}
                aria-label="Toggle family-safe mode"
              />
            </div>
            <div className="mm-settings-row" style={{ cursor: 'default' }}>
              <div className="mm-settings-row-text">
                <div className="mm-settings-row-title">Autoplay trailers</div>
                <div className="mm-settings-row-sub">Auto-start video previews</div>
              </div>
              <button
                type="button"
                className={`mm-settings-toggle ${preferences.autoplayTrailers ? 'on' : ''}`}
                onClick={() => setPreferences({ ...preferences, autoplayTrailers: !preferences.autoplayTrailers })}
                aria-label="Toggle autoplay trailers"
              />
            </div>
          </div>
        </div>


        <button
          type="button"
          className="mm-settings-save-btn"
          disabled={saving}
          onClick={() => void saveAll(profile, preferences)}
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
        {saveMessage && <SaveStatusMessage message={saveMessage} />}
      </div>
    </SubPageLayout>
  );
}

/* ────────────────────────────────────────────
   ONBOARDING PAGE — /onboarding
   ──────────────────────────────────────────── */

export function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, preferences, setProfile, setPreferences, saveAll, saving, saveMessage } = useSettingsState();

  const canContinue = useMemo(() => profile.fullName.trim().length > 0, [profile.fullName]);

  return (
    <SettingsLayout>
      <div className="mm-settings-body">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', marginBottom: 8 }}>Welcome to MovieMonk</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Complete your profile and preferences to unlock personalized discovery.
        </p>

        <div className="mm-settings-field">
          <label>Your name</label>
          <input
            className="mm-settings-input"
            type="text"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            placeholder="Enter your name"
          />
        </div>

        <div className="mm-settings-field">
          <label>Pick at least 3 genres</label>
          <div className="mm-settings-genre-grid">
            {GENRE_OPTIONS.map((genre) => (
              <button
                type="button"
                key={genre}
                className={`mm-settings-genre-pill ${preferences.genres.includes(genre) ? 'sel' : ''}`}
                onClick={() => {
                  const next = preferences.genres.includes(genre)
                    ? preferences.genres.filter((g) => g !== genre)
                    : [...preferences.genres, genre];
                  setPreferences({ ...preferences, genres: next });
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="mm-settings-save-btn"
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
    </SettingsLayout>
  );
}

/* ────────────────────────────────────────────
   AUTH CALLBACK — /auth/callback
   ──────────────────────────────────────────── */

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const [waitCount, setWaitCount] = useState(0);

  useEffect(() => {
    if (loading || !user) {
      if (waitCount < 20) {
        const timer = setTimeout(() => {
          setWaitCount(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
      navigate('/', { replace: true });
      return;
    }

    const localProfile = loadProfileSettings();
    navigate(localProfile.onboardingCompleted ? '/' : '/onboarding', { replace: true });
  }, [loading, user, navigate, waitCount]);

  return (
    <SettingsLayout>
      <div className="mm-settings-body">
        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Completing authentication and restoring your session...</p>
      </div>
    </SettingsLayout>
  );
}
