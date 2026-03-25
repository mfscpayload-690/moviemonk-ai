import React from 'react';
import ContentCarousel from './ContentCarousel';
import GenrePills from './GenrePills';
import HeroSpotlight from './HeroSpotlight';
import { useDiscovery } from '../hooks/useDiscovery';

interface DiscoveryPageProps {
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onOpenTitle }) => {
  const {
    heroItems,
    sections,
    movieGenres,
    selectedGenre,
    selectedGenreItems,
    isLoading,
    isGenreLoading,
    error,
    retry,
    selectGenre
  } = useDiscovery();

  const heroCandidates = heroItems.length ? heroItems : (sections[0]?.items || []).slice(0, 5);

  return (
    <div className="discovery-page animate-fade-in">
      <HeroSpotlight items={heroCandidates} isLoading={isLoading} onOpenTitle={onOpenTitle} />

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

      {sections.map((section) => (
        <ContentCarousel
          key={section.key}
          title={section.title}
          items={section.items}
          isLoading={isLoading}
          onOpenTitle={onOpenTitle}
        />
      ))}

      <section className="discovery-section">
        <div className="discovery-section-heading genre-heading">
          <div>
            <p className="discovery-section-kicker">Genres</p>
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
          title={selectedGenre ? `${selectedGenre.name} Picks` : 'Genre Picks'}
          items={selectedGenreItems}
          isLoading={isLoading || isGenreLoading}
          onOpenTitle={onOpenTitle}
        />
      </section>
    </div>
  );
};

export default DiscoveryPage;
