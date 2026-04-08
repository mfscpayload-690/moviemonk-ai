import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import ContentCarousel from './ContentCarousel';
import GenrePills from './GenrePills';
import HeroSpotlight from './HeroSpotlight';
import { useDiscovery } from '../hooks/useDiscovery';
import { loadReleaseRadarSnapshot } from '../services/releaseRadarService';
import {
  recordDiscoveryCardOpened,
  recordDiscoveryCardViewed,
  recordDiscoverySectionRendered,
  recordDiscoverySectionSkipped
} from '../services/observability';
import { DiscoveryItem, WatchlistFolder } from '../types';

interface DiscoveryPageProps {
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: DiscoveryItem) => void;
  onQuickSaveToWatchlist?: (item: DiscoveryItem) => void;
  watchlists: WatchlistFolder[];
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onOpenTitle, isWatched, onToggleWatched, onQuickSaveToWatchlist, watchlists }) => {
  const {
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    cardDensity,
    isStrictPersonalized,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  } = useDiscovery();

  const heroCandidates = heroItems.length ? heroItems : (sections[0]?.items || []).slice(0, 5);
  const [radarItems, setRadarItems] = useState<DiscoveryItem[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [radarCheckedAt, setRadarCheckedAt] = useState<string>('');

  const handleSectionVisible = useCallback((sectionKey: string, title: string, itemCount: number) => {
    recordDiscoverySectionRendered(sectionKey, title, itemCount);
    track('discovery_section_rendered', { section_key: sectionKey, section_title: title, item_count: itemCount });
  }, []);

  const handleSectionSkipped = useCallback((sectionKey: string, title: string, itemCount: number) => {
    recordDiscoverySectionSkipped(sectionKey, title, itemCount);
    track('discovery_section_skipped', { section_key: sectionKey, section_title: title, item_count: itemCount });
  }, []);

  const handleCardView = useCallback((item: DiscoveryItem, sectionKey: string, position: number) => {
    recordDiscoveryCardViewed(sectionKey, item.title, position);
    track('discovery_card_viewed', { section_key: sectionKey, title: item.title, media_type: item.media_type, position });
  }, []);

  const handleCardOpen = useCallback((item: DiscoveryItem, sectionKey: string, position: number) => {
    recordDiscoveryCardOpened(sectionKey, item.title, position);
    track('discovery_card_opened', { section_key: sectionKey, title: item.title, media_type: item.media_type, position });
  }, []);

  const loadRadar = useCallback(async () => {
    setRadarLoading(true);
    setRadarError(null);

    try {
      const snapshot = await loadReleaseRadarSnapshot(watchlists);
      setRadarItems(snapshot.items);
      setRadarCheckedAt(snapshot.checkedAt);
      if (snapshot.items.length === 0) {
        setRadarError('No accurate upcoming releases found right now.');
      }
    } catch {
      setRadarError('Release radar is temporarily unavailable.');
      setRadarItems([]);
      setRadarCheckedAt('');
    } finally {
      setRadarLoading(false);
    }
  }, [watchlists]);

  useEffect(() => {
    void loadRadar();
  }, [loadRadar]);

  const radarCheckedLabel = useMemo(() => {
    if (!radarCheckedAt) return '';
    const timestamp = Date.parse(radarCheckedAt);
    if (!Number.isFinite(timestamp)) return '';
    return `Last checked ${new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  }, [radarCheckedAt]);

  return (
    <div className={`discovery-page animate-fade-in ${cardDensity === 'compact' ? 'is-compact' : 'is-rich'}`}>
      <HeroSpotlight items={heroCandidates} isLoading={isLoading} onOpenTitle={onOpenTitle} isWatched={isWatched} onToggleWatched={onToggleWatched} onQuickSaveToWatchlist={onQuickSaveToWatchlist} />

      {error && (
        <section className="discovery-error" role="alert">
          <div>
            <p className="discovery-section-kicker">Discovery unavailable</p>
            <h2 className="discovery-section-title">Couldn’t load browse sections.</h2>
            <p className="discovery-error-copy">{error}</p>
          </div>
          <button type="button" className="discovery-cta discovery-cta-secondary" onClick={retry}>
            Try Again
          </button>
        </section>
      )}

      <section className="discovery-section">
        {radarCheckedLabel && <p className="discovery-genre-caption mb-2">{radarCheckedLabel}</p>}

        {radarError && !radarLoading && (
          <div className="discovery-error" role="status">
            <div>
              <p className="discovery-error-copy">{radarError}</p>
            </div>
            <button type="button" className="discovery-cta discovery-cta-secondary" onClick={() => void loadRadar()}>
              Retry
            </button>
          </div>
        )}

        {(radarLoading || radarItems.length > 0) && (
          <ContentCarousel
            sectionKey="release-radar"
            title="Release Radar"
            items={radarItems}
            isLoading={radarLoading}
            onSectionVisible={handleSectionVisible}
            onSectionSkipped={handleSectionSkipped}
            onCardView={handleCardView}
            onCardOpen={handleCardOpen}
            onOpenTitle={onOpenTitle}
            isWatched={isWatched}
            onToggleWatched={onToggleWatched}
            onQuickSaveToWatchlist={onQuickSaveToWatchlist}
          />
        )}
      </section>

      {sections.map((section) => (
        <ContentCarousel
          key={section.key}
          sectionKey={section.key}
          title={section.title}
          items={section.items}
          isLoading={isLoading}
          onSectionVisible={handleSectionVisible}
          onSectionSkipped={handleSectionSkipped}
          onCardView={handleCardView}
          onCardOpen={handleCardOpen}
          onOpenTitle={onOpenTitle}
          isWatched={isWatched}
          onToggleWatched={onToggleWatched}
          onQuickSaveToWatchlist={onQuickSaveToWatchlist}
        />
      ))}

      {isStrictPersonalized && !isLoading && sections.length === 0 && (
        <section className="discovery-error" role="status">
          <div>
            <p className="discovery-section-kicker">No personalized matches</p>
            <h2 className="discovery-section-title">Try broadening your preferences.</h2>
            <p className="discovery-error-copy">
              Your current language, genre, decade, and content mix filters are strict. Update preferences to see more titles.
            </p>
          </div>
        </section>
      )}

      <section className="discovery-section">
        <div className="discovery-section-heading genre-heading">
          <div>
            <h2 className="discovery-section-title">Browse by mood</h2>
          </div>
          {selectedGenre && (
            <p className="discovery-genre-caption">
              {isGenreLoading ? 'Refreshing titles...' : `Showing ${selectedGenre.name}`}
            </p>
          )}
        </div>
        <GenrePills genres={movieGenres} selectedGenre={selectedGenre} onSelectGenre={selectGenre} />
        <ContentCarousel
          sectionKey="genre-picks"
          title={selectedGenre ? `${selectedGenre.name} Picks` : 'Genre Picks'}
          items={selectedGenreItems}
          isLoading={isLoading || isGenreLoading}
          onSectionVisible={handleSectionVisible}
          onSectionSkipped={handleSectionSkipped}
          onCardView={handleCardView}
          onCardOpen={handleCardOpen}
          onOpenTitle={onOpenTitle}
          isWatched={isWatched}
          onToggleWatched={onToggleWatched}
          onQuickSaveToWatchlist={onQuickSaveToWatchlist}
        />
      </section>
    </div>
  );
};

export default DiscoveryPage;
