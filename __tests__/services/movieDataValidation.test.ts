import { hasDisplayableTitle, sanitizeMovieData } from '../../services/movieDataValidation';

describe('services/movieDataValidation', () => {
  it('returns null for non-object input', () => {
    expect(sanitizeMovieData(null)).toBeNull();
    expect(sanitizeMovieData(undefined)).toBeNull();
    expect(sanitizeMovieData('bad')).toBeNull();
  });

  it('normalizes loose AI payload safely', () => {
    const payload = {
      title: 'Interstellar',
      year: 2014,
      type: 'unknown',
      genres: ['Sci-Fi', 42, '', null],
      cast: [{ name: 'Matthew McConaughey', role: 'Cooper' }, { foo: 'bar' }],
      crew: { director: 'Christopher Nolan' },
      where_to_watch: [{ platform: 'Prime Video', link: 123, type: 'invalid' }],
      ratings: [{ source: 'IMDb', score: 8.7 }, {}],
      poster_url: null,
      backdrop_url: undefined,
      trailer_url: 12,
      summary_short: 'Short',
      summary_medium: 'Medium',
      summary_long_spoilers: 'Long',
      suspense_breaker: '',
      extra_images: ['https://image.tmdb.org/a.jpg', 100],
      ai_notes: 'Notes'
    };

    const sanitized = sanitizeMovieData(payload);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.title).toBe('Interstellar');
    expect(sanitized?.year).toBe('2014');
    expect(sanitized?.type).toBe('movie');
    expect(sanitized?.genres).toEqual(['Sci-Fi', '42']);
    expect(sanitized?.cast[0].name).toBe('Matthew McConaughey');
    expect(sanitized?.crew.director).toBe('Christopher Nolan');
    expect(sanitized?.where_to_watch[0].type).toBe('subscription');
    expect(sanitized?.ratings[0].score).toBe('8.7');
  });

  it('hasDisplayableTitle validates title safely', () => {
    expect(hasDisplayableTitle(null)).toBe(false);
    expect(hasDisplayableTitle(sanitizeMovieData({ title: '   ' }) as any)).toBe(false);
    expect(hasDisplayableTitle(sanitizeMovieData({ title: 'Dune', year: '2021' }) as any)).toBe(true);
  });
});
