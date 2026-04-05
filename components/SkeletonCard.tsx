import React from 'react';

interface SkeletonCardProps {
  variant?: 'poster' | 'hero' | 'compact';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'poster', className = '' }) => {
  if (variant === 'hero') {
    return (
      <div className={`discovery-hero-skeleton ${className}`}>
        <div className="discovery-skeleton discovery-skeleton-backdrop skeleton-shimmer" />
        <div className="discovery-hero-skeleton-copy">
          <div className="discovery-skeleton discovery-skeleton-eyebrow skeleton-shimmer" />
          <div className="discovery-skeleton discovery-skeleton-title skeleton-shimmer" />
          <div className="discovery-skeleton discovery-skeleton-meta skeleton-shimmer" />
          <div className="discovery-skeleton discovery-skeleton-body skeleton-shimmer" />
          <div className="discovery-skeleton discovery-skeleton-body short skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`discovery-poster-skeleton compact ${className}`}>
        <div className="discovery-skeleton discovery-skeleton-poster-compact skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className={`discovery-poster-skeleton ${className}`}>
      <div className="discovery-skeleton discovery-skeleton-poster skeleton-shimmer" />
      <div className="discovery-skeleton discovery-skeleton-caption skeleton-shimmer" />
      <div className="discovery-skeleton discovery-skeleton-caption short skeleton-shimmer" />
    </div>
  );
};

export default SkeletonCard;
