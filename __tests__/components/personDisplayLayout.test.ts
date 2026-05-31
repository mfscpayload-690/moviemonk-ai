import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PersonDisplay, { PersonPayload } from '../../components/PersonDisplay';

jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => React.createElement('span', null, 'B'),
  LocationIcon: () => React.createElement('span', null, 'L'),
  SparklesIcon: () => React.createElement('span', null, '*'),
  WatchedIcon: ({ filled }: { filled?: boolean }) => React.createElement('span', null, filled ? 'watched' : 'unwatched'),
  TagIcon: () => React.createElement('span', null, 'Tag')
}));

jest.mock('../../lib/perfDebug', () => ({
  useRenderCounter: () => undefined
}));

jest.mock('@vercel/analytics/react', () => ({
  track: () => undefined
}));

describe('PersonDisplay layout', () => {
  const payload: PersonPayload = {
    person: {
      id: 99,
      name: 'Chris Hemsworth',
      biography: Array.from({ length: 90 }, (_, index) => `Biography sentence ${index}`).join(' '),
      birthday: '1983-08-11',
      place_of_birth: 'Melbourne, Australia',
      profile_url: 'https://image.tmdb.org/t/p/w342/chris.jpg',
      known_for_department: 'Acting'
    },
    filmography: [],
    top_work: [
      { id: 1, title: 'Top Film', year: 2024, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/top.jpg' }
    ],
    credits_all: [
      { id: 2, title: 'Recent Film', year: 2025, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/recent.jpg' }
    ],
    credits_acting: [
      { id: 2, title: 'Recent Film', year: 2025, role: 'cast', media_type: 'movie', role_bucket: 'acting', poster_url: '/recent.jpg' }
    ],
    credits_directing: [],
    role_distribution: { acting: 1, directing: 0, other: 0 },
    career_span: { start_year: 2011, end_year: 2025, active_years: 15 },
    known_for_tags: ['Acting', 'Film'],
    related_people: [
      { id: 7, name: 'Taika Waititi', known_for: 'Director and actor' }
    ],
    sources: [
      { name: 'TMDB', url: 'https://www.themoviedb.org/person/99' }
    ]
  };

  it('renders the redesigned profile sections and controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(PersonDisplay, {
        data: payload,
        onQuickSearch: () => undefined,
        onBriefMe: () => undefined,
        onOpenTitle: () => undefined,
        isWatched: (id: number) => id === 2,
        onToggleWatched: () => undefined,
        onQuickSaveToWatchlist: () => undefined,
        watchlists: []
      })
    );

    expect(html).toContain('Person Profile');
    expect(html).toContain('Biography');
    expect(html).toContain('Read full biography');
    expect(html).toContain('Top Works');
    expect(html).toContain('Recent Credits');
    expect(html).toContain('Filmography');
    expect(html).toContain('Explore credits by role in release order.');
    expect(html).toContain('Related People');
    expect(html).toContain('Sources');
    expect(html).toContain('Save');
    expect(html).toContain('Watched');
    expect(html).toContain('aria-pressed="true"');
  });

  it('renders professional empty states when optional data is unavailable', () => {
    const emptyPayload: PersonPayload = {
      person: {
        id: 100,
        name: 'No Data Person'
      },
      filmography: []
    };

    const html = renderToStaticMarkup(
      React.createElement(PersonDisplay, {
        data: emptyPayload,
        onQuickSearch: () => undefined,
        onBriefMe: () => undefined,
        onOpenTitle: () => undefined
      })
    );

    expect(html).toContain('Biography unavailable.');
    expect(html).toContain('Top works unavailable');
    expect(html).toContain('No credits match these filters');
    expect(html).toContain('No collaborator graph yet');
    expect(html).toContain('Sources unavailable');
  });
});
