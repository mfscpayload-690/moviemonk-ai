import { getNextHighlightIndex, resolveEnterAction } from '../../services/suggestInteraction';

describe('suggestInteraction', () => {
  it('cycles highlight index forward and backward', () => {
    expect(getNextHighlightIndex(-1, 'next', 3)).toBe(0);
    expect(getNextHighlightIndex(0, 'next', 3)).toBe(1);
    expect(getNextHighlightIndex(2, 'next', 3)).toBe(0);

    expect(getNextHighlightIndex(-1, 'prev', 3)).toBe(2);
    expect(getNextHighlightIndex(0, 'prev', 3)).toBe(2);
  });

  it('selects highlighted item when present', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: 1,
        suggestionsCount: 3,
        topConfidence: 0.1
      })
    ).toBe('select_highlighted');
  });

  it('auto-selects top candidate only when confidence is high', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 3,
        topConfidence: 0.9
      })
    ).toBe('select_top');

    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 3,
        topConfidence: 0.6
      })
    ).toBe('prompt_inline_selection');
  });

  it('falls back to normal submit with no suggestions', () => {
    expect(
      resolveEnterAction({
        highlightedIndex: -1,
        suggestionsCount: 0,
        topConfidence: 0
      })
    ).toBe('submit_query');
  });
});
