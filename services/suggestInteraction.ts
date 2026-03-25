export type EnterAction =
  | 'select_highlighted'
  | 'select_top'
  | 'prompt_inline_selection'
  | 'submit_query';

interface ResolveEnterActionParams {
  highlightedIndex: number;
  suggestionsCount: number;
  topConfidence?: number;
  confidenceThreshold?: number;
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
