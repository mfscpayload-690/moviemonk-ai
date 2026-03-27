import { parsePersonIntent, resolveRoleMatch } from './personIntent';
import { inferInteractionIntent } from './suggestInteraction';

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

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[a.length][b.length];
}

function getFuzzySimilarity(query: string, title: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);
  if (!normalizedQuery || !normalizedTitle) return 0;

  const distance = levenshteinDistance(normalizedQuery, normalizedTitle);
  const maxLen = Math.max(normalizedQuery.length, normalizedTitle.length);
  const editSimilarity = maxLen > 0 ? Math.max(0, 1 - distance / maxLen) : 0;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const titleTokenSet = new Set(titleTokens);
  const tokenHits = queryTokens.filter((token) => titleTokenSet.has(token)).length;
  const tokenSimilarity = queryTokens.length > 0 ? tokenHits / queryTokens.length : 0;

  return Number((editSimilarity * 0.6 + tokenSimilarity * 0.4).toFixed(3));
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
  const fuzzySimilarity = getFuzzySimilarity(normalizedQuery, normalizedTitle);
  return 18 + tokenMatches * 10 + fuzzySimilarity * 26;
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
  if (queryYear === candidateYear) return 12;

  const queryYearNum = Number(queryYear);
  const candidateYearNum = Number(candidateYear);
  if (!Number.isFinite(queryYearNum) || !Number.isFinite(candidateYearNum)) return 0;

  const yearDistance = Math.abs(queryYearNum - candidateYearNum);
  if (yearDistance === 1) return 6;
  if (yearDistance === 2) return 3;
  return 0;
}

function getInteractionIntentBoost(query: string, candidate: SuggestCandidate): number {
  const intent = inferInteractionIntent(query);
  let boost = 0;

  if (intent.prefersPersonResult) {
    boost += candidate.type === 'person' ? 14 : -4;
  }

  if (intent.prefersExactTitle) {
    const normalizedTitle = normalizeText(candidate.title);
    const normalizedQuery = normalizeText(query.replace(/\b(19|20)\d{2}\b/g, ' '));
    if (normalizedTitle === normalizedQuery) boost += 10;
  }

  if (intent.typedYear && candidate.year && intent.typedYear === candidate.year) {
    boost += 4;
  }

  return boost;
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
      // Weighted blend:
      // - Title relevance (exact/starts-with/fuzzy): strongest signal
      // - Popularity: weak prior
      // - Year confidence: medium when year is typed
      // - Person and interaction intent: query-context aware boosts
      const titleScore = getTitleMatchScore(query, candidate.title);
      const popularityBoost = getPopularityBoost(candidate.popularity);
      const yearBoost = getYearBoost(queryYear, candidate.year);
      const personFocusBoost = getPersonFocusBoost(intent.is_person_focused, candidate.type);
      const roleMatchBoost = candidate.type === 'person'
        ? getRoleMatchBoost(intent.requested_role, candidate.known_for_department)
        : 0;
      const knownForBoost = candidate.type === 'person'
        ? getKnownForOverlapBoost(intent.tokens, candidate.known_for_titles)
        : 0;
      const interactionIntentBoost = getInteractionIntentBoost(query, candidate);
      const score = titleScore + popularityBoost + yearBoost + personFocusBoost + roleMatchBoost + knownForBoost + interactionIntentBoost;

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
