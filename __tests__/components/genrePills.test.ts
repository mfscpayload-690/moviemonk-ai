import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GenrePills from '../../components/GenrePills';

describe('GenrePills', () => {
  const mockGenres = [
    { id: 28, name: 'Action' },
    { id: 10749, name: 'Romance' },
    { id: 35, name: 'Comedy' }
  ];

  it('renders pills with active and loaded states', () => {
    const html = renderToStaticMarkup(
      React.createElement(GenrePills, {
        genres: mockGenres,
        selectedGenre: mockGenres[0],
        loadedGenreIds: [28, 10749],
        onSelectGenre: () => undefined
      })
    );

    expect(html).toContain('Action');
    expect(html).toContain('Romance');
    expect(html).toContain('Comedy');
    expect(html).toContain('is-active');
    expect(html).toContain('is-loaded');
    expect(html).toContain('discovery-genre-pill-dot');
  });

  it('returns null when genres array is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(GenrePills, {
        genres: [],
        selectedGenre: null,
        onSelectGenre: () => undefined
      })
    );
    expect(html).toBe('');
  });
});

