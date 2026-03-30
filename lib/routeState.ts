export type RouteKind =
  | 'home'
  | 'search'
  | 'movie'
  | 'tv'
  | 'person'
  | 'watchlists'
  | 'settings'
  | 'settings-profile'
  | 'settings-preferences'
  | 'auth-callback'
  | 'onboarding'
  | 'unknown';

export type ParsedRoute = {
  kind: RouteKind;
  id?: number;
  query?: string;
};

export function parseAppRoute(pathname: string, search: string): ParsedRoute {
  const normalizedPath = pathname || '/';
  const params = new URLSearchParams(search || '');

  if (normalizedPath === '/') {
    const q = params.get('q');
    if (q) return { kind: 'search', query: q };
    return { kind: 'home' };
  }
  if (normalizedPath === '/search') return { kind: 'search', query: params.get('q') || '' };
  if (normalizedPath === '/watchlists') return { kind: 'watchlists' };
  if (normalizedPath === '/settings') return { kind: 'settings' };
  if (normalizedPath === '/settings/profile') return { kind: 'settings-profile' };
  if (normalizedPath === '/settings/preferences') return { kind: 'settings-preferences' };
  if (normalizedPath === '/auth/callback') return { kind: 'auth-callback' };
  if (normalizedPath === '/onboarding') return { kind: 'onboarding' };

  const movieMatch = normalizedPath.match(/^\/movie\/(\d+)$/);
  if (movieMatch) return { kind: 'movie', id: Number(movieMatch[1]) };

  const tvMatch = normalizedPath.match(/^\/tv\/(\d+)$/);
  if (tvMatch) return { kind: 'tv', id: Number(tvMatch[1]) };

  const personMatch = normalizedPath.match(/^\/person\/(\d+)$/);
  if (personMatch) return { kind: 'person', id: Number(personMatch[1]) };

  return { kind: 'unknown' };
}
