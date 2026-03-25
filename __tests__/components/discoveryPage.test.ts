import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('../../hooks/useDiscovery', () => ({
  useDiscovery: jest.fn()
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
      onOpenTitle: () => undefined
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
      isLoading: true,
      isGenreLoading: false,
      error: null,
      retry: jest.fn(),
      selectGenre: jest.fn()
    });

    const html = renderPage();
    expect(html).toContain('discovery-hero-skeleton');
  });
});
