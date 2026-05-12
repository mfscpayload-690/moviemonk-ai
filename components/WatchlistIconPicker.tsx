import React from 'react';
import {
  FilmIcon,
  FolderIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  TicketIcon,
  TvIcon,
  WatchedIcon,
} from './icons';
import {
  Camera,
  Flame,
  Ghost,
  Heart,
  Music2,
  Rocket,
} from 'lucide-react';

export type WatchlistIconKey =
  | 'folder'
  | 'film'
  | 'tv'
  | 'ticket'
  | 'star'
  | 'tag'
  | 'watch'
  | 'sparkles'
  | 'heart'
  | 'ghost'
  | 'rocket'
  | 'flame'
  | 'music'
  | 'camera'
  | 'shield'
;

type IconComponent = React.ComponentType<{ className?: string }>;

export type WatchlistIconOption = {
  key: WatchlistIconKey;
  label: string;
  Icon: IconComponent;
};

export const WATCHLIST_ICON_DEFAULT: WatchlistIconKey = 'folder';

export const WATCHLIST_ICON_OPTIONS: WatchlistIconOption[] = [
  { key: 'folder', label: 'Folder', Icon: FolderIcon },
  { key: 'film', label: 'Film', Icon: FilmIcon },
  { key: 'tv', label: 'TV', Icon: TvIcon },
  { key: 'ticket', label: 'Ticket', Icon: TicketIcon },
  { key: 'star', label: 'Star', Icon: StarIcon },
  { key: 'tag', label: 'Tag', Icon: TagIcon },
  { key: 'watch', label: 'Watched', Icon: WatchedIcon },
  { key: 'sparkles', label: 'Fantasy', Icon: SparklesIcon },
  { key: 'heart', label: 'Romance', Icon: Heart },
  { key: 'ghost', label: 'Horror', Icon: Ghost },
  { key: 'rocket', label: 'Sci-Fi', Icon: Rocket },
  { key: 'flame', label: 'Action', Icon: Flame },
  { key: 'music', label: 'Musical', Icon: Music2 },
  { key: 'camera', label: 'Docu', Icon: Camera },
  { key: 'shield', label: 'Crime', Icon: ShieldIcon },
];

export function getWatchlistIconOption(iconKey?: string): WatchlistIconOption {
  return WATCHLIST_ICON_OPTIONS.find((option) => option.key === iconKey) || WATCHLIST_ICON_OPTIONS[0];
}

export function WatchlistIconBadge({ iconKey, className }: { iconKey?: string; className?: string }) {
  const option = getWatchlistIconOption(iconKey);
  const Icon = option.Icon;
  return <Icon className={className} />;
}

export function WatchlistIconPicker({
  selectedIcon,
  onSelect,
  compactLabel = 'Pick an icon',
}: {
  selectedIcon: string;
  onSelect: (iconKey: WatchlistIconKey) => void;
  compactLabel?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Compute base keys visible on mobile when collapsed (exactly 4 items, ensuring active selection is included)
  const mobileBaseKeys = React.useMemo(() => {
    const base = WATCHLIST_ICON_OPTIONS.slice(0, 4).map(o => o.key);
    if (!base.includes(selectedIcon as WatchlistIconKey)) {
      return [...base.slice(0, 3), selectedIcon as WatchlistIconKey];
    }
    return base;
  }, [selectedIcon]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{compactLabel}</p>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-brand-primary hover:underline font-medium md:hidden"
        >
          {isExpanded ? 'Show less' : 'View more'}
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {WATCHLIST_ICON_OPTIONS.map((option) => {
          const isSelected = option.key === selectedIcon;
          const isMobileVisible = mobileBaseKeys.includes(option.key);
          const visibilityClass = isExpanded || isMobileVisible ? 'flex' : 'hidden md:flex';
          const Icon = option.Icon;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              className={`group ${visibilityClass} flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-all duration-150 ${isSelected ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 bg-white/5 text-brand-text-light hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
              aria-label={option.label}
              title={option.label}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isSelected ? 'bg-white/10' : 'bg-black/20'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-medium leading-none truncate w-full text-center">{option.label}</span>
            </button>
          );
        })}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="group flex md:hidden flex-col items-center justify-center gap-1 rounded-xl border border-white/5 bg-white/5 px-2 py-2 text-brand-text-light hover:border-white/20 hover:bg-white/10 hover:text-white transition-all duration-150"
            title="View all folder icons"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-xs font-bold text-brand-primary">
              +{WATCHLIST_ICON_OPTIONS.length - 4}
            </span>
            <span className="text-[10px] font-medium leading-none truncate w-full text-center">More</span>
          </button>
        )}
      </div>
    </div>
  );
}
