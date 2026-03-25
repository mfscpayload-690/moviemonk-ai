import React from 'react';
import { DiscoveryGenre } from '../types';

interface GenrePillsProps {
  genres: DiscoveryGenre[];
  selectedGenre: DiscoveryGenre | null;
  onSelectGenre: (genre: DiscoveryGenre) => void;
}

const GenrePills: React.FC<GenrePillsProps> = ({ genres, selectedGenre, onSelectGenre }) => {
  if (!genres.length) return null;

  return (
    <div className="discovery-genre-pills" role="tablist" aria-label="Browse by genre">
      {genres.map((genre) => {
        const isActive = selectedGenre?.id === genre.id;
        return (
          <button
            key={genre.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`discovery-genre-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectGenre(genre)}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
};

export default GenrePills;
