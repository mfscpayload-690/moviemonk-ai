import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../hooks/useDiscovery', () => ({
  useDiscovery: jest.fn(),
  getPrioritizedGenreList: jest.fn((genres) => genres)
}));
jest.mock('../../components/icons', () => ({
  ArrowLeftIcon: () => React.createElement('span', null, '<'),
  ArrowRightIcon: () => React.createElement('span', null, '>')
}));

import { useDiscovery } from '../../hooks/useDiscovery';
import DiscoveryPage from '../../components/DiscoveryPage';

const mockUseDiscovery = useDiscovery as jest.Mock;

function renderPage() {
  return renderToStaticMarkup(
    React.createElement(DiscoveryPage, {
      onOpenTitle: () => undefined,
      onRunQuery: () => undefined,
      watchlists: []
    })
  );
}

describe('DiscoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty hero copy when no data is available', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('Browse what is trending right now.');
  });

  it('renders error state with retry affordance', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: false,
      isGenreLoading: false,
      error: 'Network failed',
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('Discovery unavailable');
    expect(html).toContain('Try Again');
    expect(html).toContain('Network failed');
  });

  it('renders hero skeleton while loading', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: true,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('discovery-hero-skeleton');
  });

  it('renders dashboard sections in the expected order', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [
        { key: 'trending-movies', title: 'Trending Movies', items: [] },
        { key: 'upcoming', title: 'Upcoming', items: [] },
        { key: 'now-playing-mix', title: 'Now Playing', items: [] },
        { key: 'top-rated-movies-series', title: 'Top Rated Movies & Series', items: [] },
        { key: 'global-web-series-tv', title: 'Global Web Series and TV Shows', items: [] },
        { key: 'kdrama-asian-series', title: 'K-Drama and Asian Series', items: [] }
      ],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html.indexOf('Trending Movies')).toBeLessThan(html.indexOf('Upcoming'));
    expect(html.indexOf('Upcoming')).toBeLessThan(html.indexOf('Now Playing'));
    expect(html.indexOf('Now Playing')).toBeLessThan(html.indexOf('Top Rated Movies &amp; Series'));
    expect(html.indexOf('Top Rated Movies &amp; Series')).toBeLessThan(html.indexOf('Global Web Series and TV Shows'));
    expect(html.indexOf('Global Web Series and TV Shows')).toBeLessThan(html.indexOf('K-Drama and Asian Series'));
  });

  it('renders the personalized empty state with recovery actions', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [],
      selectedGenre: null,
      selectedGenreItems: [],
      cardDensity: 'rich',
      isStrictPersonalized: true,
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('No personalized matches yet');
    expect(html).toContain('Reset strict filters');
    expect(html).toContain('Tune preferences');
  });

  it('renders multi-rail genre sections and load more button', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [
        { id: 28, name: 'Action' },
        { id: 10749, name: 'Romance' },
        { id: 35, name: 'Comedy' },
        { id: 27, name: 'Horror' }
      ],
      selectedGenre: { id: 28, name: 'Action' },
      selectedGenreItems: [],
      genreRails: [
        { genre: { id: 28, name: 'Action' }, items: [], isLoading: false },
        { genre: { id: 10749, name: 'Romance' }, items: [], isLoading: false }
      ],
      loadMoreGenres: jest.fn(),
      loadSpecificGenre: jest.fn(),
      isLoadingMoreGenres: false,
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('Action Picks');
    expect(html).toContain('Romance Picks');
    expect(html).toContain('Discover More Genres');
  });

  it('renders all explored indicator when all genres are loaded', () => {
    mockUseDiscovery.mockReturnValue({
      heroItems: [],
      sections: [],
      movieGenres: [
        { id: 28, name: 'Action' },
        { id: 10749, name: 'Romance' }
      ],
      selectedGenre: { id: 28, name: 'Action' },
      selectedGenreItems: [],
      genreRails: [
        { genre: { id: 28, name: 'Action' }, items: [], isLoading: false },
        { genre: { id: 10749, name: 'Romance' }, items: [], isLoading: false }
      ],
      loadMoreGenres: jest.fn(),
      loadSpecificGenre: jest.fn(),
      isLoadingMoreGenres: false,
      cardDensity: 'rich',
      isStrictPersonalized: false,
      isLoading: false,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('All genres unlocked');
    expect(html).not.toContain('Discover More Genres');
  });
});
