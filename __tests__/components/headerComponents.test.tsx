import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchCapsule } from '../../components/header/SearchCapsule';
import { WatchlistHeaderButton } from '../../components/header/WatchlistHeaderButton';
import { UserProfileMenu } from '../../components/header/UserProfileMenu';
import { QueryComplexity } from '../../types';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signOut: jest.fn()
  })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '' })
}));

describe('Header Revamp Components', () => {
  describe('SearchCapsule', () => {
    it('renders placeholder and shortcut badge in idle state', () => {
      const html = renderToStaticMarkup(
        <SearchCapsule
          query=""
          analysisMode={QueryComplexity.SIMPLE}
          onClick={() => {}}
        />
      );

      expect(html).toContain('Search movies');
      expect(html).toContain('⌘');
      expect(html).toContain('K');
      expect(html).toContain('Quick');
    });

    it('renders active query text and deep mode indicator', () => {
      const html = renderToStaticMarkup(
        <SearchCapsule
          query="Inception"
          analysisMode={QueryComplexity.COMPLEX}
          onClick={() => {}}
        />
      );

      expect(html).toContain('Inception');
      expect(html).toContain('Deep');
    });

    it('contains strictly zero raw unicode emojis', () => {
      const html = renderToStaticMarkup(
        <SearchCapsule
          query=""
          analysisMode={QueryComplexity.SIMPLE}
          onClick={() => {}}
        />
      );

      // Verify no emoji unicode ranges in output
      expect(html).not.toMatch(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    });
  });

  describe('WatchlistHeaderButton', () => {
    it('renders Watchlist label and badge count when items exist', () => {
      const html = renderToStaticMarkup(
        <WatchlistHeaderButton
          totalCount={7}
          onOpenWatchlists={() => {}}
        />
      );

      expect(html).toContain('Watchlist');
      expect(html).toContain('7');
      expect(html).toContain('aria-label="View watchlists, 7 saved items"');
    });

    it('caps count display at 99+', () => {
      const html = renderToStaticMarkup(
        <WatchlistHeaderButton
          totalCount={120}
          onOpenWatchlists={() => {}}
        />
      );

      expect(html).toContain('99+');
    });

    it('hides count badge when totalCount is 0', () => {
      const html = renderToStaticMarkup(
        <WatchlistHeaderButton
          totalCount={0}
          onOpenWatchlists={() => {}}
        />
      );

      expect(html).toContain('Watchlist');
      expect(html).toContain('0 saved items');
      expect(html).not.toContain('bg-gradient-to-r');
    });
  });

  describe('UserProfileMenu', () => {
    it('renders Sign in action button when user is unauthenticated', () => {
      const html = renderToStaticMarkup(
        <UserProfileMenu
          user={null}
          isCloud={false}
          isSyncing={false}
          canShare={false}
          onOpenWatchlists={() => {}}
          onOpenSettings={() => {}}
          onShare={() => {}}
        />
      );

      expect(html).toContain('Sign in');
      expect(html).toContain('Log in');
    });

    it('renders avatar and syncing status indicator when user is authenticated', () => {
      const mockUser: any = {
        id: 'usr-123',
        email: 'test@moviemonk.com',
        user_metadata: { full_name: 'Test Cinephile' }
      };

      const html = renderToStaticMarkup(
        <UserProfileMenu
          user={mockUser}
          isCloud={true}
          isSyncing={true}
          canShare={false}
          onOpenWatchlists={() => {}}
          onOpenSettings={() => {}}
          onShare={() => {}}
        />
      );

      expect(html).toContain('bg-amber-400');
      expect(html).toContain('animate-pulse');
      expect(html).toContain('title="Syncing..."');
    });
  });
});

