import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PersonDisplay, { PersonPayload } from '../../components/PersonDisplay';

jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => React.createElement('span', null, 'B'),
  LocationIcon: () => React.createElement('span', null, 'L'),
  SparklesIcon: () => React.createElement('span', null, '*')
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
      biography: 'Australian actor with a wide filmography.',
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
    known_for_tags: ['Acting', 'Film']
  };

  it('renders editorial sections and keeps a single primary hero CTA label', () => {
    const html = renderToStaticMarkup(
      React.createElement(PersonDisplay, {
        data: payload,
        onQuickSearch: () => undefined,
        onBriefMe: () => undefined,
        onOpenTitle: () => undefined
      })
    );

    expect(html).toContain('Best Movies');
    expect(html).toContain('More');
    expect(html).toContain('Career Span');
    expect(html).toContain('Biography');
    expect(html).toContain('Top Works');
    expect(html).toContain('Recent Credits');
    expect(html).toContain('Filmography');
  });
});
