import { PersonIntent } from '../types';

const STOP_TOKENS = new Set([
  'best',
  'top',
  'movies',
  'movie',
  'films',
  'film',
  'shows',
  'show',
  'series',
  'about',
  'of',
  'the',
  'a',
  'an',
  'please',
  'find',
  'search',
  'for'
]);

const PERSON_ROLE_PATTERNS: Array<{ role: PersonIntent['requested_role']; pattern: RegExp }> = [
  { role: 'director', pattern: /\b(director|filmmaker|helmer)\b/i },
  { role: 'actor', pattern: /\b(actor|actors|male actor)\b/i },
  { role: 'actress', pattern: /\b(actress|actresses|female actor)\b/i }
];

function normalizeToken(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function parsePersonIntent(query: string): PersonIntent {
  const raw = String(query || '').trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  const requestedRole = PERSON_ROLE_PATTERNS.find((entry) => entry.pattern.test(raw))?.role || 'any';

  const stripped = normalized
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(actor|actors|actress|actresses|director|filmmaker|helmer|male actor|female actor)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = stripped
    .split(' ')
    .map(normalizeToken)
    .filter((token) => token.length > 1 && !STOP_TOKENS.has(token));

  const hasPersonCue = /\b(actor|actress|director|cast|starring|filmography|movies by|shows by|who is)\b/i.test(raw);
  const queryLooksLikeName = tokens.length >= 2 && tokens.length <= 4;
  const isPersonFocused = requestedRole !== 'any' || hasPersonCue || queryLooksLikeName;

  return {
    raw_query: raw,
    normalized_query: normalized,
    stripped_query: stripped || normalized,
    tokens,
    year: yearMatch?.[0],
    requested_role: requestedRole,
    is_person_focused: isPersonFocused
  };
}

export function resolveRoleMatch(
  requestedRole: PersonIntent['requested_role'],
  knownForDepartment?: string
): 'match' | 'mismatch' | 'neutral' {
  if (requestedRole === 'any') return 'neutral';
  const normalizedDepartment = (knownForDepartment || '').toLowerCase();
  if (!normalizedDepartment) return 'neutral';

  if (requestedRole === 'director') {
    return normalizedDepartment.includes('direct') ? 'match' : 'mismatch';
  }

  if (requestedRole === 'actor' || requestedRole === 'actress') {
    return normalizedDepartment.includes('acting') || normalizedDepartment.includes('actor')
      ? 'match'
      : 'mismatch';
  }

  return 'neutral';
}
