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
  let data: any;
  let error: any;

  ({ data, error } = await client
    .from('user_preferences')
    .select('genres, languages, favorite_decades, favorite_regions, content_mix, maturity_filter, reduced_motion, autoplay_trailers, card_density')
    .eq('user_id', userId)
    .maybeSingle());

  if (error && /column .*reduced_motion|reduced_motion does not exist|schema cache/i.test(String(error?.message || error))) {
    const fallback = await client
      .from('user_preferences')
      .select('genres, languages, favorite_decades, favorite_regions, content_mix, maturity_filter, autoplay_trailers, card_density')
      .eq('user_id', userId)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;

  if (!data) {
    return DEFAULT_PREFERENCE_SETTINGS;
  }

  return {
    genres: Array.isArray(data.genres) ? data.genres : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    favoriteDecades: Array.isArray(data.favorite_decades) ? data.favorite_decades : [],
    favoriteRegions: Array.isArray(data.favorite_regions) ? data.favorite_regions : [],
    contentMix: data.content_mix || 'balanced',
    familySafe: data.maturity_filter !== 'strict',
    reducedMotion: Boolean(data.reduced_motion),
    autoplayTrailers: Boolean(data.autoplay_trailers),
    cardDensity: data.card_density || 'rich'
  };
}

export async function upsertPreferenceSettings(userId: string, settings: UserPreferenceSettings): Promise<void> {
  const client = getClientOrThrow();
  const payload: Record<string, unknown> = {
    user_id: userId,
    genres: settings.genres,
    languages: settings.languages,
    favorite_decades: settings.favoriteDecades,
    favorite_regions: settings.favoriteRegions,
    content_mix: settings.contentMix,
    maturity_filter: settings.familySafe ? 'standard' : 'strict',
    reduced_motion: settings.reducedMotion,
    autoplay_trailers: settings.autoplayTrailers,
    card_density: settings.cardDensity,
    updated_at: new Date().toISOString()
  };

  let { error } = await client.from('user_preferences').upsert(payload);

  if (error && /column .*reduced_motion|reduced_motion does not exist|schema cache/i.test(String(error?.message || error))) {
    delete payload.reduced_motion;
    const retry = await client.from('user_preferences').upsert(payload);
    error = retry.error;
  }

  if (error) throw error;
}
