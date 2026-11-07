import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TVShowDisplay from '../../components/TVShowDisplay';
import { MovieData, TVShowEpisode } from '../../types';

jest.mock('../../lib/apiClient', () => ({
  apiGet: jest.fn().mockResolvedValue({ ok: true, episodes: [] })
}));

describe('TVShowDisplay Episode Slicing and View More', () => {
  const createMockShow = (episodeCount: number): MovieData => {
    const episodes: TVShowEpisode[] = Array.from({ length: episodeCount }, (_, i) => ({
      id: i + 1,
      name: `Episode Title ${i + 1}`,
      season: 1,
      episode: i + 1,
      airdate: '2026-01-01',
      runtime: 45,
      rating: 8.5,
      image: null,
      summary: `Episode ${i + 1} summary description`
    }));

    return {
      title: 'Epic Adventure',
      year: '2026',
      type: 'show',
      genres: ['Action', 'Sci-Fi'],
      poster_url: '',
      backdrop_url: '',
      trailer_url: '',
      ratings: [],
      cast: [],
      crew: { director: 'Director Name', writer: 'Writer Name', music: 'Composer Name' },
      summary_short: 'Short summary',
      summary_medium: 'Medium summary',
      summary_long_spoilers: 'Long spoilers',
      suspense_breaker: '',
      where_to_watch: [],
      extra_images: [],
      ai_notes: '',
      tvShow: {
        status: 'Running',
        premiered: '2026-01-01',
        ended: null,
        totalSeasons: 1,
        totalEpisodes: episodeCount,
        network: 'Netflix',
        language: 'en',
        officialSite: null,
        seasons: [{
          number: 1,
          name: 'Season 1',
          episodeCount,
          premiereDate: '2026-01-01',
          endDate: null,
          image: null,
          summary: null
        }],
        episodes
      }
    };
  };

  it('limits to first 10 episodes and shows View More button when season has >10 episodes', () => {
    const movie = createMockShow(16);
    const html = renderToStaticMarkup(<TVShowDisplay movie={movie} />);

    // First 10 should be visible
    expect(html).toContain('Episode Title 1');
    expect(html).toContain('Episode Title 10');

    // 11th episode should NOT be rendered initially
    expect(html).not.toContain('Episode Title 11');

    // View More button should show the exact remaining count (16 - 10 = 6)
    expect(html).toContain('View More (6 remaining)');
  });

  it('renders all episodes directly without View More button when season has 10 or fewer episodes', () => {
    const movie = createMockShow(8);
    const html = renderToStaticMarkup(<TVShowDisplay movie={movie} />);

    // All 8 should be rendered
    expect(html).toContain('Episode Title 1');
    expect(html).toContain('Episode Title 8');

    // View More button should NOT appear
    expect(html).not.toContain('View More');
  });
});

