import React from 'react';

interface SkeletonCardProps {
  variant?: 'poster' | 'hero';
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'poster', className = '' }) => {
  if (variant === 'hero') {
    return (
      <div className={`discovery-hero-skeleton ${className}`}>
        <div className="discovery-skeleton discovery-skeleton-backdrop" />
        <div className="discovery-hero-skeleton-copy">
          <div className="discovery-skeleton discovery-skeleton-eyebrow" />
          <div className="discovery-skeleton discovery-skeleton-title" />
          <div className="discovery-skeleton discovery-skeleton-meta" />
          <div className="discovery-skeleton discovery-skeleton-body" />
          <div className="discovery-skeleton discovery-skeleton-body short" />
        </div>
      </div>
    );
  }

  return (
    <div className={`discovery-poster-skeleton ${className}`}>
      <div className="discovery-skeleton discovery-skeleton-poster" />
      <div className="discovery-skeleton discovery-skeleton-caption" />
      <div className="discovery-skeleton discovery-skeleton-caption short" />
    </div>
  );
};

export default SkeletonCard;
