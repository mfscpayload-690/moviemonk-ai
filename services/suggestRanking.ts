import { parsePersonIntent, resolveRoleMatch } from './personIntent';

export type SuggestEntityType = 'movie' | 'show' | 'person';

export interface SuggestCandidate {
  id: number;
  title: string;
  year?: string;
  type: SuggestEntityType;
  media_type: 'movie' | 'tv' | 'person';
  poster_url?: string;
  popularity?: number;
  known_for_department?: string;
  known_for_titles?: string[];
}

export interface RankedSuggestCandidate extends SuggestCandidate {
  score: number;
  confidence: number;
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYear(input: string): string | undefined {
  const match = input.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

function getTitleMatchScore(query: string, title: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);

  if (!normalizedQuery || !normalizedTitle) return 0;
  if (normalizedTitle === normalizedQuery) return 120;
  if (normalizedTitle.startsWith(normalizedQuery)) return 80;
  if (normalizedTitle.includes(normalizedQuery)) return 45;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const tokenMatches = queryTokens.reduce((count, token) => {
    if (token.length < 2) return count;
    return count + (titleTokens.some((titleToken) => titleToken.startsWith(token) || titleToken.includes(token)) ? 1 : 0);
  }, 0);

  if (tokenMatches === 0) return 0;
  return 18 + tokenMatches * 10;
}

function getPopularityBoost(popularity?: number): number {
  if (!popularity || popularity <= 0) return 0;
  // Log scale keeps popularity helpful without overpowering title relevance.
  return Math.min(12, Math.log10(popularity + 1) * 4);
}

function getRoleMatchBoost(
  requestedRole: 'any' | 'actor' | 'actress' | 'director',
  knownForDepartment: string | undefined
): number {
  if (requestedRole === 'any') return 0;
  const roleMatch = resolveRoleMatch(requestedRole, knownForDepartment);
  if (roleMatch === 'match') {
    return requestedRole === 'director' ? 30 : 26;
  }
  if (roleMatch === 'mismatch') return -10;
  return 0;
}

function getKnownForOverlapBoost(tokens: string[], knownForTitles?: string[]): number {
  if (!tokens.length || !Array.isArray(knownForTitles) || knownForTitles.length === 0) return 0;
  const haystack = normalizeText(knownForTitles.join(' '));
  if (!haystack) return 0;

  const matches = tokens.reduce((count, token) => count + (haystack.includes(token) ? 1 : 0), 0);
  return Math.min(14, matches * 5);
}

function getPersonFocusBoost(isPersonFocused: boolean, type: SuggestEntityType): number {
  if (!isPersonFocused) return 0;
  return type === 'person' ? 22 : -6;
}

function getYearBoost(queryYear: string | undefined, candidateYear: string | undefined): number {
  if (!queryYear || !candidateYear) return 0;
  return queryYear === candidateYear ? 10 : 0;
}

function toConfidence(score: number): number {
  if (score <= 0) return 0;
  const confidence = score / 140;
  return Math.max(0, Math.min(0.99, Number(confidence.toFixed(3))));
}

export function rankSuggestCandidates(query: string, candidates: SuggestCandidate[]): RankedSuggestCandidate[] {
  const queryYear = extractYear(query);
  const intent = parsePersonIntent(query);

  return candidates
    .map((candidate) => {
      const titleScore = getTitleMatchScore(query, candidate.title);
      const popularityBoost = getPopularityBoost(candidate.popularity);
      const yearBoost = getYearBoost(queryYear, candidate.year);
      const personFocusBoost = getPersonFocusBoost(intent.isPersonFocused, candidate.type);
      const roleMatchBoost = candidate.type === 'person'
        ? getRoleMatchBoost(intent.requestedRole, candidate.known_for_department)
        : 0;
      const knownForBoost = candidate.type === 'person'
        ? getKnownForOverlapBoost(intent.tokens, candidate.known_for_titles)
        : 0;
      const score = titleScore + popularityBoost + yearBoost + personFocusBoost + roleMatchBoost + knownForBoost;

      return {
        ...candidate,
        score,
        confidence: toConfidence(score)
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.popularity || 0) - (a.popularity || 0);
    });
}
