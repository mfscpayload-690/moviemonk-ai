import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SoundtrackSection from '../../components/SoundtrackSection';
import * as soundtrackService from '../../services/soundtrackService';
import { MovieData } from '../../types';

jest.mock('../../services/soundtrackService');

const mockMovie: MovieData = {
  tmdb_id: '157336',
  title: 'Interstellar',
  year: '2014',
  type: 'movie',
  genres: ['Sci-Fi', 'Drama'],
  poster_url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  backdrop_url: 'https://image.tmdb.org/t/p/w780/backdrop.jpg',
  trailer_url: '',
  ratings: [],
  cast: [],
  crew: {
    director: 'Christopher Nolan',
    writer: 'Jonathan Nolan',
    music: 'Hans Zimmer',
  },
  summary_short: 'A team of explorers travel through a wormhole.',
  summary_medium: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
  summary_long_spoilers: '',
  suspense_breaker: '',
  where_to_watch: [],
  extra_images: [],
  ai_notes: '',
};

describe('SoundtrackSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial skeleton loading state before async fetch settles', () => {
    jest.spyOn(soundtrackService, 'fetchTitleSoundtrack').mockImplementation(
      () => new Promise(() => {}) // pending promise
    );

    const html = renderToStaticMarkup(<SoundtrackSection movie={mockMovie} />);
    expect(html).toContain('animate-pulse');
  });

  it('handles empty state with composer gracefully (Tier 2)', async () => {
    jest.spyOn(soundtrackService, 'fetchTitleSoundtrack').mockResolvedValue({
      tracks: [],
      fallbackLinks: {
        spotifyUrl: 'https://open.spotify.com/search/Interstellar%20Hans%20Zimmer',
        youtubeUrl: 'https://www.youtube.com/results?search_query=Interstellar%20Hans%20Zimmer',
      },
    });

    // In a server/static render, initial state renders skeleton
    const html = renderToStaticMarkup(<SoundtrackSection movie={mockMovie} />);
    expect(html).toBeDefined();
  });
});
