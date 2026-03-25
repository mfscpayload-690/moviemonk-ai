import {
  buildPersonCardPresentation,
  formatKnownForSnippet,
  sortPersonShortlist
} from '../../services/personPresentation';

describe('personPresentation', () => {
  it('builds role chip and known-for snippet from TMDB fields', () => {
    const card = buildPersonCardPresentation({
      name: 'Christopher Nolan',
      known_for_department: 'Directing',
      known_for_titles: ['Inception', 'Interstellar', 'Dunkirk']
    });

    expect(card.roleChip).toBe('Directing');
    expect(card.snippet).toContain('Inception');
  });

  it('uses fallback snippet when known_for_titles are missing', () => {
    const snippet = formatKnownForSnippet({ known_for: 'Known for dramatic biopics and action thrillers' });
    expect(snippet).toContain('Known for dramatic biopics');
  });

  it('sorts shortlist by confidence, role match, then popularity', () => {
    const sorted = sortPersonShortlist([
      { id: 1, score: 0.7, role_match: 'neutral', popularity: 90 },
      { id: 2, score: 0.7, role_match: 'match', popularity: 10 },
      { id: 3, score: 0.82, role_match: 'mismatch', popularity: 10 }
    ]);

    expect((sorted as any[]).map((item) => item.id)).toEqual([3, 2, 1]);
  });
});
