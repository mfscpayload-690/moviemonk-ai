export type SexOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type UserProfileSettings = {
  fullName: string;
  sex: SexOption;
  countryCode: string;
  avatarUrl: string;
  onboardingCompleted: boolean;
};

export type UserPreferenceSettings = {
  genres: string[];
  languages: string[];
  favoriteDecades: string[];
  favoriteRegions: string[];
  contentMix: 'balanced' | 'mostly_movies' | 'mostly_series';
  familySafe: boolean;
  autoplayTrailers: boolean;
  cardDensity: 'compact' | 'rich';
};

export const DEFAULT_PROFILE_SETTINGS: UserProfileSettings = {
  fullName: '',
  sex: 'prefer_not_to_say',
  countryCode: '',
  avatarUrl: '',
  onboardingCompleted: false
};

export const DEFAULT_PREFERENCE_SETTINGS: UserPreferenceSettings = {
  genres: [],
  languages: [],
  favoriteDecades: [],
  favoriteRegions: [],
  contentMix: 'balanced',
  familySafe: true,
  autoplayTrailers: false,
  cardDensity: 'rich'
};

const PROFILE_STORAGE_KEY = 'moviemonk_profile_settings_v1';
const PREFERENCES_STORAGE_KEY = 'moviemonk_preference_settings_v1';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function loadProfileSettings(): UserProfileSettings {
  return safeParse<UserProfileSettings>(localStorage.getItem(PROFILE_STORAGE_KEY), DEFAULT_PROFILE_SETTINGS);
}

export function saveProfileSettings(settings: UserProfileSettings): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(settings));
}

export function loadPreferenceSettings(): UserPreferenceSettings {
  return safeParse<UserPreferenceSettings>(localStorage.getItem(PREFERENCES_STORAGE_KEY), DEFAULT_PREFERENCE_SETTINGS);
}

export function savePreferenceSettings(settings: UserPreferenceSettings): void {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(settings));
}
