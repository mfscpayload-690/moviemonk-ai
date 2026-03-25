import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AmbiguousModal from '../../components/AmbiguousModal';

describe('AmbiguousModal', () => {
  const candidates = [
    {
      id: 1,
      title: 'Christopher Nolan',
      type: 'person' as const,
      score: 0.91,
      known_for_department: 'Directing',
      role_match: 'match' as const,
      known_for_titles: ['Inception']
    },
    {
      id: 2,
      title: 'Inception',
      type: 'movie' as const,
      score: 0.88
    }
  ];

  it('renders default mode with generic search title', () => {
    const html = renderToStaticMarkup(
      React.createElement(AmbiguousModal, {
        candidates,
        onSelect: () => undefined,
        onClose: () => undefined
      })
    );

    expect(html).toContain('Search Results');
    expect(html).toContain('Inception');
  });

  it('renders person-shortlist mode with role cues and no generic tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(AmbiguousModal, {
        mode: 'person-shortlist',
        candidates,
        onSelect: () => undefined,
        onClose: () => undefined
      })
    );

    expect(html).toContain('Choose the right person');
    expect(html).toContain('Directing');
    expect(html).toContain('Role match');
    expect(html).not.toContain('All (');
  });
});
