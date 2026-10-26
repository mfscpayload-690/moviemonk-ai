import { searchMovieItems, SearchableMovieItem } from '../../hooks/useMovieSearch';

describe('searchMovieItems', () => {
  const sampleItems: SearchableMovieItem[] = [
    { title: 'The Matrix', year: '1999', genres: ['Action', 'Sci-Fi'], overview: 'A hacker discovers reality is a simulation.', cast: ['Keanu Reeves', 'Laurence Fishburne'] },
    { title: 'Inception', year: '2010', genres: ['Action', 'Sci-Fi'], overview: 'A thief steals secrets through dream-sharing technology.', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'] },
    { title: 'Amélie', year: '2001', genres: ['Comedy', 'Romance'], overview: 'An imaginative Parisienne decides to help those around her.', cast: ['Audrey Tautou', 'Mathieu Kassovitz'] },
    { title: 'Pokémon: The First Movie', year: '1998', genres: ['Animation', 'Adventure'], overview: 'Mewtwo battles trainers on New Island.', cast: ['Ikue Otani'] }
  ];

  it('returns all items up to default limit when query is empty', () => {
    const results = searchMovieItems(sampleItems, '');
    expect(results).toHaveLength(sampleItems.length);
  });

  it('filters items matching title query', () => {
    const results = searchMovieItems(sampleItems, 'matrix');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Matrix');
  });

  it('matches accented characters with unaccented query (diacritic-insensitive)', () => {
    const r1 = searchMovieItems(sampleItems, 'amelie');
    expect(r1).toHaveLength(1);
    expect(r1[0].title).toBe('Amélie');

    const r2 = searchMovieItems(sampleItems, 'pokemon');
    expect(r2).toHaveLength(1);
    expect(r2[0].title).toBe('Pokémon: The First Movie');
  });

  it('matches accented query against unaccented title', () => {
    const results = searchMovieItems(sampleItems, 'Mátrix');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Matrix');
  });

  it('matches across genres, overview, and cast', () => {
    const byCast = searchMovieItems(sampleItems, 'keanu');
    expect(byCast[0].title).toBe('The Matrix');

    const byGenre = searchMovieItems(sampleItems, 'romance');
    expect(byGenre[0].title).toBe('Amélie');

    const byOverview = searchMovieItems(sampleItems, 'simulation');
    expect(byOverview[0].title).toBe('The Matrix');
  });

  it('matches one-character typos for title words when term length is at least 5', () => {
    const results = searchMovieItems(sampleItems, 'matrx');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('The Matrix');
  });

  it('does not match typos when term length is under 5 characters or distance exceeds 1', () => {
    // 3 chars typo: 'thw' vs 'the' should not match
    const shortTypo = searchMovieItems(sampleItems, 'thw');
    expect(shortTypo).toHaveLength(0);

    // 2-char edit distance: 'mtrx' vs 'matrix'
    const twoTypos = searchMovieItems(sampleItems, 'mtrx');
    expect(twoTypos).toHaveLength(0);
  });

  it('respects the limit option', () => {
    const results = searchMovieItems(sampleItems, 'sci-fi', { limit: 1 });
    expect(results).toHaveLength(1);
  });
});
