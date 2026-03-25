import { rankSuggestCandidates } from '../../services/suggestRanking';

describe('rankSuggestCandidates', () => {
  it('orders exact match before starts-with and partial', () => {
    const ranked = rankSuggestCandidates('Fresh', [
      {
        id: 1,
        title: 'Fresh',
        media_type: 'movie',
        type: 'movie',
        popularity: 10
      },
      {
        id: 2,
        title: 'Fresh Prince',
        media_type: 'tv',
        type: 'show',
        popularity: 50
      },
      {
        id: 3,
        title: 'Super Fresh Vibes',
        media_type: 'movie',
        type: 'movie',
        popularity: 100
      }
    ]);

    expect(ranked[0].title).toBe('Fresh');
    expect(ranked[1].title).toBe('Fresh Prince');
    expect(ranked[2].title).toBe('Super Fresh Vibes');
  });

  it('boosts matching year when typed', () => {
    const ranked = rankSuggestCandidates('Dune 2021', [
      {
        id: 11,
        title: 'Dune',
        media_type: 'movie',
        type: 'movie',
        year: '1984',
        popularity: 60
      },
      {
        id: 12,
        title: 'Dune',
        media_type: 'movie',
        type: 'movie',
        year: '2021',
        popularity: 1
      }
    ]);

    expect(ranked[0].year).toBe('2021');
  });
});
