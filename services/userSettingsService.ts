import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  DEFAULT_PREFERENCE_SETTINGS,
  DEFAULT_PROFILE_SETTINGS,
  UserPreferenceSettings,
  UserProfileSettings
} from '../lib/userSettings';

function getClientOrThrow() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

export async function fetchProfileSettings(userId: string): Promise<UserProfileSettings> {
  const client = getClientOrThrow();
  const { data, error } = await client
    .from('profiles')
    .select('full_name, sex, country_code, avatar_url, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return DEFAULT_PROFILE_SETTINGS;
  }

  return {
    fullName: data.full_name || '',
    sex: data.sex || 'prefer_not_to_say',
    countryCode: data.country_code || '',
    avatarUrl: data.avatar_url || '',
    onboardingCompleted: Boolean(data.onboarding_completed)
  };
}

export async function upsertProfileSettings(userId: string, settings: UserProfileSettings): Promise<void> {
  const client = getClientOrThrow();
  const { error } = await client.from('profiles').upsert({
    id: userId,
    full_name: settings.fullName,
    sex: settings.sex,
    country_code: settings.countryCode,
    avatar_url: settings.avatarUrl,
    onboarding_completed: settings.onboardingCompleted,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
}

export async function fetchPreferenceSettings(userId: string): Promise<UserPreferenceSettings> {
  const client = getClientOrThrow();
  const { data, error } = await client
    .from('user_preferences')
    .select('genres, languages, favorite_decades, favorite_regions, content_mix, maturity_filter, autoplay_trailers, card_density, notifications_enabled, notification_channels, notification_frequency')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return DEFAULT_PREFERENCE_SETTINGS;
  }

  const channels = Array.isArray(data.notification_channels)
    ? data.notification_channels.filter((ch: unknown): ch is 'in_app' | 'email' | 'push' => ch === 'in_app' || ch === 'email' || ch === 'push')
    : [];

  const legacyEnabled = Boolean(data.notifications_enabled);
  const notificationChannels = channels.length > 0 ? channels : (legacyEnabled ? ['in_app'] : []);
  const notificationFrequency = data.notification_frequency === 'daily' || data.notification_frequency === 'weekly' || data.notification_frequency === 'off'
    ? data.notification_frequency
    : (legacyEnabled ? 'weekly' : 'off');
  const notificationsEnabled = notificationFrequency !== 'off' && notificationChannels.length > 0;

  return {
    genres: Array.isArray(data.genres) ? data.genres : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    favoriteDecades: Array.isArray(data.favorite_decades) ? data.favorite_decades : [],
    favoriteRegions: Array.isArray(data.favorite_regions) ? data.favorite_regions : [],
    contentMix: data.content_mix || 'balanced',
    familySafe: data.maturity_filter !== 'strict',
    autoplayTrailers: Boolean(data.autoplay_trailers),
    cardDensity: data.card_density || 'rich',
    notificationsEnabled,
    notificationChannels,
    notificationFrequency
  };
}

export async function upsertPreferenceSettings(userId: string, settings: UserPreferenceSettings): Promise<void> {
  const client = getClientOrThrow();
  const notificationsEnabled = settings.notificationFrequency !== 'off' && settings.notificationChannels.length > 0;

  const { error } = await client.from('user_preferences').upsert({
    user_id: userId,
    genres: settings.genres,
    languages: settings.languages,
    favorite_decades: settings.favoriteDecades,
    favorite_regions: settings.favoriteRegions,
    content_mix: settings.contentMix,
    maturity_filter: settings.familySafe ? 'standard' : 'strict',
    autoplay_trailers: settings.autoplayTrailers,
    card_density: settings.cardDensity,
    notifications_enabled: notificationsEnabled,
    notification_channels: settings.notificationChannels,
    notification_frequency: settings.notificationFrequency,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
}
