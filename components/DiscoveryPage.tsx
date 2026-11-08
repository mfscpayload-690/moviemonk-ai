import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics/react';
import { Sparkles } from 'lucide-react';
import ContentCarousel from './ContentCarousel';
import HeroSpotlight from './HeroSpotlight';
import { useDiscovery, getPrioritizedGenreList, GenreRail } from '../hooks/useDiscovery';
import { loadReleaseRadarSnapshot, hasRadarInputs } from '../services/releaseRadarService';
import {
  recordDiscoveryCardOpened,
  recordDiscoveryCardViewed,
  recordDiscoverySectionRendered,
  recordDiscoverySectionSkipped
} from '../services/observability';
import { loadPreferenceSettings, savePreferenceSettings } from '../lib/userSettings';
import { DiscoveryItem, WatchlistFolder } from '../types';

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
    genreRails,
    loadMoreGenres,
    loadSpecificGenre,
    isLoadingMoreGenres,
    cardDensity,
    isStrictPersonalized,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  } = useDiscovery();

  const curatedGenreList = useMemo(() => {
    const prefs = loadPreferenceSettings();
    if (typeof getPrioritizedGenreList === 'function') {
      return getPrioritizedGenreList(movieGenres, prefs.genres);
    }
    return movieGenres;
  }, [movieGenres]);

  const effectiveGenreRails = useMemo<GenreRail[]>(() => {
    if (genreRails && genreRails.length > 0) {
      return genreRails;
    }
    if (selectedGenre) {
      return [{ genre: selectedGenre, items: selectedGenreItems, isLoading: isLoading || isGenreLoading }];
    }
    return [];
  }, [genreRails, selectedGenre, selectedGenreItems, isLoading, isGenreLoading]);

  const totalCuratedCount = curatedGenreList.length || 8;
  const loadedGenreCount = effectiveGenreRails.length;
  const hasMoreGenres = Boolean(loadedGenreCount < totalCuratedCount && movieGenres.length > 0);

  const handleLoadMoreGenres = useCallback(() => {
    if (loadMoreGenres) {
      void loadMoreGenres();
      track('discovery_genre_rails_expanded', {
        currently_loaded: effectiveGenreRails.length,
        total: totalCuratedCount
      });
    }
  }, [effectiveGenreRails.length, loadMoreGenres, totalCuratedCount]);

  const heroCandidates = heroItems.length ? heroItems : (sections[0]?.items || []).slice(0, 5);
  const [radarItems, setRadarItems] = useState<DiscoveryItem[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [showDeferredSections, setShowDeferredSections] = useState(!HAS_IDLE_CALLBACK_SUPPORT);
  const [railOrder, setRailOrder] = useState<string[]>(() => loadRailOrder());
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
    if (!hasRadarInputs(watchlists)) {
      setRadarLoading(false);
      setRadarItems([]);
      return;
    }
    setRadarLoading(true);

    try {
      const snapshot = await loadReleaseRadarSnapshot(watchlists);
      setRadarItems(snapshot.items);
    } catch {
      setRadarItems([]);
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


      {orderedRails.map((rail) => (
        <ContentCarousel
          key={rail.key}
          sectionKey={rail.key}
          title={rail.title}
          items={rail.items}
          isLoading={rail.isLoading}
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

      {effectiveGenreRails.map((rail) => (
        <ContentCarousel
          key={`genre-picks-${rail.genre.id}`}
          sectionKey={`genre-picks-${rail.genre.id}`}
          title={`${rail.genre.name} Picks`}
          items={rail.items}
          isLoading={rail.isLoading}
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

      {hasMoreGenres ? (
        <div className="discovery-load-more-genres-wrapper">
          <button
            type="button"
            className="discovery-cinematic-pill"
            onClick={handleLoadMoreGenres}
            disabled={isLoadingMoreGenres}
          >
            {isLoadingMoreGenres ? (
              <>
                <Sparkles className="discovery-cinematic-pill-icon is-spinning" />
                <span>Curating more genres...</span>
              </>
            ) : (
              <>
                <Sparkles className="discovery-cinematic-pill-icon" />
                <span>Discover More Genres</span>
              </>
            )}
          </button>
        </div>
      ) : (
        movieGenres.length > 0 && loadedGenreCount >= totalCuratedCount && (
          <div className="discovery-all-genres-explored" role="status">
            <span className="discovery-explored-star" aria-hidden="true">✦</span>
            <span>All genres unlocked</span>
            <span className="discovery-explored-star" aria-hidden="true">✦</span>
          </div>
        )
      )}
    </div>
  );
};

export default DiscoveryPage;
