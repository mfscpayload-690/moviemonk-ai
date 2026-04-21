import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import { Pin, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import ContentCarousel from './ContentCarousel';
import GenrePills from './GenrePills';
import HeroSpotlight from './HeroSpotlight';
import PersonalizedFeedPanel from './PersonalizedFeedPanel';
import { useDiscovery } from '../hooks/useDiscovery';
import { loadReleaseRadarSnapshot } from '../services/releaseRadarService';
import {
  recordDiscoveryCardOpened,
  recordDiscoveryCardViewed,
  recordDiscoverySectionRendered,
  recordDiscoverySectionSkipped
} from '../services/observability';
import { loadPreferenceSettings, savePreferenceSettings } from '../lib/userSettings';
import { DiscoveryItem, WatchlistFolder } from '../types';
import { buildRevealStyle, getRevealClassName, useScrollReveal } from '../hooks/useScrollReveal';

interface DiscoveryPageProps {
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  onRunQuery: (query: string) => void;
  isWatched?: (id: number, mediaType: 'movie' | 'tv') => boolean;
  onToggleWatched?: (item: DiscoveryItem) => void;
  onQuickSaveToWatchlist?: (item: DiscoveryItem) => void;
  watchlists: WatchlistFolder[];
}

const PRIORITY_SECTION_COUNT = 2;
const DISCOVERY_RAIL_ORDER_KEY = 'moviemonk_discovery_rail_order_v1';
const HAS_IDLE_CALLBACK_SUPPORT =
  typeof window !== 'undefined' && 'requestIdleCallback' in window;

type DiscoveryRail = {
  key: string;
  title: string;
  items: DiscoveryItem[];
  isLoading?: boolean;
};

function loadRailOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DISCOVERY_RAIL_ORDER_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveRailOrder(order: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISCOVERY_RAIL_ORDER_KEY, JSON.stringify(order));
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onOpenTitle, onRunQuery, isWatched, onToggleWatched, onQuickSaveToWatchlist, watchlists }) => {
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
  const [showDeferredSections, setShowDeferredSections] = useState(!HAS_IDLE_CALLBACK_SUPPORT);
  const [railOrder, setRailOrder] = useState<string[]>(() => loadRailOrder());
  const { ref: radarRevealRef, isRevealed: isRadarRevealed } = useScrollReveal<HTMLElement>();
  const { ref: moodRevealRef, isRevealed: isMoodRevealed } = useScrollReveal<HTMLElement>();
  const prioritySections = useMemo(() => sections.slice(0, PRIORITY_SECTION_COUNT), [sections]);
  const deferredSections = useMemo(() => sections.slice(PRIORITY_SECTION_COUNT), [sections]);

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

  useEffect(() => {
    if (!HAS_IDLE_CALLBACK_SUPPORT) {
      setShowDeferredSections(true);
      return;
    }

    if (isLoading || deferredSections.length === 0) {
      setShowDeferredSections(deferredSections.length === 0);
      return;
    }

    let idleCallbackId: number | undefined;
    const revealDeferred = () => setShowDeferredSections(true);

    idleCallbackId = (window as Window & {
      requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    }).requestIdleCallback(() => revealDeferred(), { timeout: 450 });

    return () => {
      if (
        typeof idleCallbackId === 'number'
        && typeof window !== 'undefined'
        && 'cancelIdleCallback' in window
      ) {
        (window as Window & {
          cancelIdleCallback: (handle: number) => void;
        }).cancelIdleCallback(idleCallbackId);
      }
    };
  }, [deferredSections.length, isLoading]);

  const radarCheckedLabel = useMemo(() => {
    if (!radarCheckedAt) return '';
    const timestamp = Date.parse(radarCheckedAt);
    if (!Number.isFinite(timestamp)) return '';
    return `Last checked ${new Date(timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  }, [radarCheckedAt]);

  const discoveryRails = useMemo<DiscoveryRail[]>(() => {
    const rails: DiscoveryRail[] = [];
    if (radarLoading || radarItems.length > 0) {
      rails.push({
        key: 'release-radar',
        title: 'Release Radar',
        items: radarItems,
        isLoading: radarLoading
      });
    }

    prioritySections.forEach((section) => {
      rails.push({ key: section.key, title: section.title, items: section.items, isLoading });
    });

    if (showDeferredSections) {
      deferredSections.forEach((section) => {
        rails.push({ key: section.key, title: section.title, items: section.items, isLoading });
      });
    }

    return rails;
  }, [deferredSections, isLoading, prioritySections, radarItems, radarLoading, showDeferredSections]);

  const orderedRails = useMemo(() => {
    const orderMap = new Map(railOrder.map((key, index) => [key, index]));
    return [...discoveryRails].sort((a, b) => {
      const aIndex = orderMap.get(a.key);
      const bIndex = orderMap.get(b.key);
      if (typeof aIndex === 'number' && typeof bIndex === 'number') return aIndex - bIndex;
      if (typeof aIndex === 'number') return -1;
      if (typeof bIndex === 'number') return 1;
      return 0;
    });
  }, [discoveryRails, railOrder]);

  useEffect(() => {
    const availableKeys = discoveryRails.map((rail) => rail.key);
    setRailOrder((current) => {
      const next = [...current.filter((key) => availableKeys.includes(key)), ...availableKeys.filter((key) => !current.includes(key))];
      if (next.join('|') !== current.join('|')) {
        saveRailOrder(next);
      }
      return next;
    });
  }, [discoveryRails]);

  const updateRailOrder = useCallback((nextOrder: string[]) => {
    setRailOrder(nextOrder);
    saveRailOrder(nextOrder);
  }, []);

  const moveRailToTop = useCallback((key: string) => {
    const next = [key, ...railOrder.filter((entry) => entry !== key)];
    updateRailOrder(next);
  }, [railOrder, updateRailOrder]);

  const moveRail = useCallback((key: string, direction: -1 | 1) => {
    const currentIndex = railOrder.indexOf(key);
    if (currentIndex === -1) return;
    const nextIndex = Math.max(0, Math.min(railOrder.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    const next = [...railOrder];
    const [rail] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, rail);
    updateRailOrder(next);
  }, [railOrder, updateRailOrder]);

  const resetStrictFilters = useCallback(() => {
    const current = loadPreferenceSettings();
    savePreferenceSettings({
      ...current,
      genres: [],
      languages: [],
      favoriteDecades: [],
      favoriteRegions: [],
      contentMix: 'balanced'
    });
  }, []);

  return (
    <div className={`discovery-page animate-fade-in ${cardDensity === 'compact' ? 'is-compact' : 'is-rich'}`}>
      <HeroSpotlight items={heroCandidates} isLoading={isLoading} onOpenTitle={onOpenTitle} isWatched={isWatched} onToggleWatched={onToggleWatched} onQuickSaveToWatchlist={onQuickSaveToWatchlist} />

      <PersonalizedFeedPanel
        onRunQuery={onRunQuery}
        onOpenTitle={onOpenTitle}
        watchlists={watchlists}
      />

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

      <section
        ref={radarRevealRef}
        className={getRevealClassName(isRadarRevealed, 'fade', 'discovery-section')}
        data-reveal-variant="fade"
        style={buildRevealStyle(0, 420)}
      >
        {radarCheckedLabel && <p className="discovery-genre-caption mb-2">{radarCheckedLabel}</p>}

        {radarError && !radarLoading && (
          <div className="mm-empty-state" role="status">
            <h3>Release radar is quiet right now</h3>
            <p>{radarError} Add a few saved titles to sharpen the radar, or retry to pull a fresher release pass.</p>
            <div className="mm-empty-state-actions">
              <button type="button" className="mm-empty-state-cta" onClick={() => void loadRadar()}>
                Retry release radar
              </button>
              <a href="/watchlists" className="mm-empty-state-cta-secondary">
                Open watchlists
              </a>
            </div>
          </div>
        )}
      </section>

      {orderedRails.map((rail) => (
        <ContentCarousel
          key={rail.key}
          sectionKey={rail.key}
          title={rail.title}
          items={rail.items}
          isLoading={rail.isLoading}
          headerActions={(
            <>
              <button type="button" className="mm-icon-button" onClick={() => moveRailToTop(rail.key)} aria-label={`Pin ${rail.title} to top`}>
                <Pin className="w-4 h-4" />
              </button>
              <button type="button" className="mm-icon-button" onClick={() => moveRail(rail.key, -1)} aria-label="Move up">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" className="mm-icon-button" onClick={() => moveRail(rail.key, 1)} aria-label="Move down">
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
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
        <section className="mm-empty-state" role="status">
          <h3>No personalized matches yet</h3>
          <p>Your current language, genre, decade, and content-mix filters are very narrow. Relax them a little and MovieMonk will surface a wider discovery mix.</p>
          <div className="mm-empty-state-actions">
            <button type="button" className="mm-empty-state-cta" onClick={resetStrictFilters}>
              Reset strict filters
            </button>
            <a href="/settings/preferences" className="mm-empty-state-cta-secondary">
              Tune preferences
            </a>
          </div>
        </section>
      )}

      <section
        ref={moodRevealRef}
        className={getRevealClassName(isMoodRevealed, 'fade', 'discovery-section')}
        data-reveal-variant="fade"
        style={buildRevealStyle(0, 420)}
      >
        <div
          className={getRevealClassName(isMoodRevealed, 'rise-up', 'discovery-section-heading genre-heading')}
          data-reveal-variant="rise-up"
          style={buildRevealStyle(60, 420)}
        >
          <div>
            <h2 className="discovery-section-title">Browse by mood</h2>
          </div>
          <div className="mm-section-toolbar">
            {selectedGenre && (
              <p className="discovery-genre-caption">
                {isGenreLoading ? 'Refreshing titles...' : `Showing ${selectedGenre.name}`}
              </p>
            )}
            <button type="button" className="mm-icon-button" onClick={() => updateRailOrder(discoveryRails.map((rail) => rail.key))} aria-label="Reset discovery rail order">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
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
