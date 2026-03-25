import React from 'react';
import { DiscoveryItem } from '../types';

interface PosterCardProps {
  item: DiscoveryItem;
  onOpenTitle: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
}

const formatRating = (rating: number | null) => (
  typeof rating === 'number' && Number.isFinite(rating) ? rating.toFixed(1) : 'N/A'
);

const PosterCard: React.FC<PosterCardProps> = ({ item, onOpenTitle }) => (
  <button
    type="button"
    className="discovery-poster-card"
    onClick={() => onOpenTitle({ id: item.id, mediaType: item.media_type })}
    aria-label={`Open ${item.title}${item.year ? ` (${item.year})` : ''}`}
  >
    <div className="discovery-poster-frame">
      {item.poster_url ? (
        <img
          src={item.poster_url}
          alt={`${item.title} poster`}
          className="discovery-poster-image"
          loading="lazy"
        />
      ) : (
        <div className="discovery-poster-empty">
          <span>{item.media_type === 'tv' ? 'Show' : 'Movie'}</span>
        </div>
      )}
      <span className="discovery-poster-plus" aria-hidden="true">+</span>
    </div>
    <span className="discovery-poster-title">{item.title}</span>
    <span className="discovery-poster-meta">{item.year || 'TBA'} • {formatRating(item.rating)}</span>
  </button>
);

export default PosterCard;
