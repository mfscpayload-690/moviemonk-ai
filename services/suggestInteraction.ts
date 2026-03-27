export type EnterAction =
  | 'select_highlighted'
  | 'select_top'
  | 'prompt_inline_selection'
  | 'submit_query';

export interface InteractionIntent {
  prefersPersonResult: boolean;
  prefersExactTitle: boolean;
  typedYear?: string;
  confidenceThreshold: number;
}

interface ResolveEnterActionParams {
  highlightedIndex: number;
  suggestionsCount: number;
  topConfidence?: number;
  confidenceThreshold?: number;
}

export function inferInteractionIntent(query: string): InteractionIntent {
  const normalized = String(query || '').toLowerCase();
  const typedYear = normalized.match(/\b(19|20)\d{2}\b/)?.[0];
  const prefersPersonResult = /\b(actor|actress|director|cast|starring|who is|by )\b/.test(normalized);
  const prefersExactTitle = /\b(exact|full title|named|called)\b/.test(normalized) || Boolean(typedYear);

  // When users type intent-rich query (year or person cues), require stronger confidence for auto-select.
  const confidenceThreshold = prefersPersonResult || prefersExactTitle ? 0.88 : 0.82;

  return {
    prefersPersonResult,
    prefersExactTitle,
    typedYear,
    confidenceThreshold
  };
}

export function getNextHighlightIndex(
  currentIndex: number,
  direction: 'next' | 'prev',
  total: number
): number {
  if (total <= 0) return -1;
  if (currentIndex < 0) return direction === 'next' ? 0 : total - 1;

  if (direction === 'next') {
    return (currentIndex + 1) % total;
  }
  return (currentIndex - 1 + total) % total;
}

export function resolveEnterAction({
  highlightedIndex,
  suggestionsCount,
  topConfidence,
  confidenceThreshold = 0.82
}: ResolveEnterActionParams): EnterAction {
  if (suggestionsCount <= 0) {
    return 'submit_query';
  }

  if (highlightedIndex >= 0 && highlightedIndex < suggestionsCount) {
    return 'select_highlighted';
  }

  if ((topConfidence || 0) >= confidenceThreshold) {
    return 'select_top';
  }

  return 'prompt_inline_selection';
}
