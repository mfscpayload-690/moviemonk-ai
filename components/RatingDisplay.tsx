import React from 'react';
import { StarIcon } from './icons';

interface RatingDisplayProps {
  score: number | string | null;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

/**
 * Returns star color based on rating score (0-10 scale)
 * 0-3: red (poor)
 * 3-5: orange (below average)
 * 5-7: yellow/amber (average)
 * 7-8.5: green (good)
 * 8.5-10: bright green (excellent)
 */
const getStarColor = (score: number): string => {
  if (score < 3) return 'text-red-500';
  if (score < 5) return 'text-orange-500';
  if (score < 7) return 'text-yellow-500';
  if (score < 8.5) return 'text-green-500';
  return 'text-emerald-400';
};

/**
 * Returns badge background color based on rating score
 * Slightly desaturated for better readability with text
 */
const getBadgeColor = (score: number): string => {
  if (score < 3) return 'bg-red-950';
  if (score < 5) return 'bg-orange-950';
  if (score < 7) return 'bg-yellow-950';
  if (score < 8.5) return 'bg-green-950';
  return 'bg-emerald-950';
};

const RatingDisplay: React.FC<RatingDisplayProps> = ({ score, size = 'md', compact = false }) => {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  const isValid = typeof numScore === 'number' && Number.isFinite(numScore);
  
  if (!isValid) {
    return <span className="text-gray-400">N/A</span>;
  }

  const displayScore = numScore.toFixed(1);
  const starColorClass = getStarColor(numScore);
  const badgeColorClass = getBadgeColor(numScore);

  const sizeClasses = {
    sm: {
      icon: 'w-4 h-4',
      text: 'text-xs',
      container: 'flex items-center gap-1'
    },
    md: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      container: 'flex items-center gap-1.5'
    },
    lg: {
      icon: 'w-6 h-6',
      text: 'text-lg',
      container: 'flex items-center gap-2'
    }
  };

  const config = sizeClasses[size];

  if (compact) {
    return (
      <div className={config.container}>
        <StarIcon className={`${config.icon} ${starColorClass} flex-shrink-0`} />
        <span className={`${config.text} font-bold text-white`}>{displayScore}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${badgeColorClass}`}>
      <StarIcon className={`${config.icon} ${starColorClass} flex-shrink-0`} />
      <span className={`${config.text} font-bold text-white`}>{displayScore}</span>
    </div>
  );
};

export default RatingDisplay;
