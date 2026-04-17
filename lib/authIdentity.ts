import type { User } from '@supabase/supabase-js';

type OAuthProvider = 'github' | 'google' | 'email';

type IdentityLike = {
  provider?: string | null;
  identity_data?: Record<string, unknown> | null;
  last_sign_in_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const SUPPORTED_PROVIDERS = new Set<OAuthProvider>(['github', 'google', 'email']);

function parseTime(value: unknown): number {
  if (typeof value !== 'string' || value.trim().length === 0) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeProvider(value: unknown): OAuthProvider | null {
  if (typeof value !== 'string') return null;
  const provider = value.toLowerCase() as OAuthProvider;
  return SUPPORTED_PROVIDERS.has(provider) ? provider : null;
}

function getIdentities(user: User | null | undefined): IdentityLike[] {
  if (!Array.isArray(user?.identities)) return [];
  return user.identities as IdentityLike[];
}

function getLatestIdentity(
  user: User | null | undefined,
  provider?: OAuthProvider
): IdentityLike | null {
  const identities = getIdentities(user).filter((identity) => {
    const identityProvider = normalizeProvider(identity.provider);
    return provider ? identityProvider === provider : Boolean(identityProvider);
  });
  if (identities.length === 0) return null;

  return identities.sort((a, b) => {
    const aTime = Math.max(parseTime(a.last_sign_in_at), parseTime(a.updated_at), parseTime(a.created_at));
    const bTime = Math.max(parseTime(b.last_sign_in_at), parseTime(b.updated_at), parseTime(b.created_at));
    return bTime - aTime;
  })[0];
}

function getIdentityField(identity: IdentityLike | null, key: string): string | null {
  const value = identity?.identity_data?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function getActiveAuthProvider(user: User | null | undefined): OAuthProvider {
  const latestIdentity = getLatestIdentity(user);
  const latestIdentityProvider = normalizeProvider(latestIdentity?.provider);
  if (latestIdentityProvider) return latestIdentityProvider;

  const appMetadataProvider = normalizeProvider(user?.app_metadata?.provider);
  if (appMetadataProvider) return appMetadataProvider;

  if (Array.isArray(user?.app_metadata?.providers)) {
    for (const provider of user.app_metadata.providers) {
      const normalized = normalizeProvider(provider);
      if (normalized) return normalized;
    }
  }

  return 'email';
}

export function getAuthProviderLabel(user: User | null | undefined): string {
  const provider = getActiveAuthProvider(user);
  if (provider === 'github') return 'GitHub account';
  if (provider === 'google') return 'Google account';
  return 'Email account';
}

export function getAuthAvatarUrl(
  user: User | null | undefined,
  profileAvatarUrl?: string | null
): string | null {
  if (typeof profileAvatarUrl === 'string' && profileAvatarUrl.trim().length > 0) {
    return profileAvatarUrl;
  }

  const activeProvider = getActiveAuthProvider(user);
  const activeIdentity = getLatestIdentity(user, activeProvider);
  const latestIdentity = activeIdentity ?? getLatestIdentity(user);

  return (
    getIdentityField(activeIdentity, 'avatar_url') ||
    getIdentityField(activeIdentity, 'picture') ||
    getIdentityField(activeIdentity, 'avatar') ||
    getIdentityField(latestIdentity, 'avatar_url') ||
    getIdentityField(latestIdentity, 'picture') ||
    getIdentityField(latestIdentity, 'avatar') ||
    (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null) ||
    (typeof user?.user_metadata?.picture === 'string' ? user.user_metadata.picture : null) ||
    null
  );
}

export function getAuthDisplayName(
  user: User | null | undefined,
  profileFullName?: string | null
): string {
  if (typeof profileFullName === 'string' && profileFullName.trim().length > 0) {
    return profileFullName.trim();
  }

  const activeProvider = getActiveAuthProvider(user);
  const activeIdentity = getLatestIdentity(user, activeProvider);
  const latestIdentity = activeIdentity ?? getLatestIdentity(user);

  return (
    getIdentityField(activeIdentity, 'full_name') ||
    getIdentityField(activeIdentity, 'name') ||
    getIdentityField(activeIdentity, 'preferred_username') ||
    getIdentityField(latestIdentity, 'full_name') ||
    getIdentityField(latestIdentity, 'name') ||
    getIdentityField(latestIdentity, 'preferred_username') ||
    (typeof user?.user_metadata?.preferred_username === 'string' ? user.user_metadata.preferred_username : '') ||
    (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '') ||
    (typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : '') ||
    user?.email ||
    'User'
  );
}
