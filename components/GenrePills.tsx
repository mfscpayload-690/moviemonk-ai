import React from 'react';
import { DiscoveryGenre } from '../types';

interface GenrePillsProps {
  genres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  onSelectGenre: (genre: DiscoveryGenre) => void;
  loadedGenreIds?: number[];
}

const GenrePills: React.FC<GenrePillsProps> = ({
  genres,
  selectedGenre,
  onSelectGenre,
  loadedGenreIds = []
}) => {
  if (!genres.length) return null;
  const loadedSet = new Set(loadedGenreIds);

  return (
    <div className="discovery-genre-pills" role="tablist" aria-label="Browse by genre">
      {genres.map((genre) => {
        const isActive = selectedGenre?.id === genre.id;
        const isLoaded = loadedSet.has(genre.id);
        return (
          <button
            key={genre.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`discovery-genre-pill ${isActive ? 'is-active' : ''} ${isLoaded ? 'is-loaded' : ''}`}
            onClick={() => onSelectGenre(genre)}
          >
            {isLoaded && <span className="discovery-genre-pill-dot" aria-hidden="true" />}
            <span>{genre.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default GenrePills;
