export type PersonRoleMatch = 'match' | 'mismatch' | 'neutral';

export interface PersonCardInput {
  name: string;
  profile_url?: string;
  known_for_department?: string;
  known_for_titles?: string[];
  known_for?: string;
}

export interface PersonCardPresentation {
  name: string;
  avatarUrl?: string;
  roleChip: string;
  snippet: string;
}

type ShortlistCandidate = {
  score?: number;
  confidence?: number;
  popularity?: number;
  role_match?: PersonRoleMatch;
};

const ROLE_RANK: Record<PersonRoleMatch, number> = {
  match: 2,
  neutral: 1,
  mismatch: 0
};

function sanitizeText(input?: string): string {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function truncateText(input: string, max = 70): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

export function formatRoleChip(knownForDepartment?: string): string {
  const normalized = sanitizeText(knownForDepartment);
  if (!normalized) return 'Person';
  return normalized;
}

export function formatKnownForSnippet(input: Pick<PersonCardInput, 'known_for_titles' | 'known_for'>): string {
  if (Array.isArray(input.known_for_titles) && input.known_for_titles.length > 0) {
    const snippet = input.known_for_titles
      .map((title) => sanitizeText(title))
      .filter(Boolean)
      .slice(0, 3)
      .join(' • ');
    if (snippet) return truncateText(snippet, 88);
  }

  const knownFor = sanitizeText(input.known_for);
  return knownFor ? truncateText(knownFor, 88) : 'Known for notable film and TV work';
}

export function buildPersonCardPresentation(input: PersonCardInput): PersonCardPresentation {
  return {
    name: sanitizeText(input.name),
    avatarUrl: input.profile_url,
    roleChip: formatRoleChip(input.known_for_department),
    snippet: formatKnownForSnippet(input)
  };
}

export function sortPersonShortlist<T extends ShortlistCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    const scoreA = typeof a.score === 'number' ? a.score : typeof a.confidence === 'number' ? a.confidence : 0;
    const scoreB = typeof b.score === 'number' ? b.score : typeof b.confidence === 'number' ? b.confidence : 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const roleA = ROLE_RANK[a.role_match || 'neutral'];
    const roleB = ROLE_RANK[b.role_match || 'neutral'];
    if (roleB !== roleA) return roleB - roleA;

    const popularityA = typeof a.popularity === 'number' ? a.popularity : 0;
    const popularityB = typeof b.popularity === 'number' ? b.popularity : 0;
    if (popularityB !== popularityA) return popularityB - popularityA;

    return 0;
  });
}
