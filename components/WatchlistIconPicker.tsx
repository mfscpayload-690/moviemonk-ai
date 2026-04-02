import React, { useMemo, useState } from 'react';
import {
  BellIcon,
  BirthdayIcon,
  ClipboardIcon,
  EditIcon,
  FilterIcon,
  FilmIcon,
  FolderIcon,
  GlobeIcon,
  LocationIcon,
  MoreIcon,
  SearchIcon,
  ShareIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  TicketIcon,
  TrendingIcon,
  TvIcon,
  WatchedIcon,
} from './icons';
import {
  Bookmark,
  Camera,
  BookOpen,
  Coffee,
  Crown,
  Flame,
  Gamepad2,
  Ghost,
  Heart,
  Home,
  Leaf,
  MoonStar,
  Music2,
  PartyPopper,
  Rocket,
  Smile,
  SunMedium,
  Trophy,
  Mountain,
  GraduationCap,
} from 'lucide-react';

export type WatchlistIconKey =
  | 'folder'
  | 'film'
  | 'tv'
  | 'star'
  | 'sparkles'
  | 'tag'
  | 'ticket'
  | 'watch'
  | 'shield'
  | 'globe'
  | 'search'
  | 'bell'
  | 'birthday'
  | 'edit'
  | 'clipboard'
  | 'share'
  | 'filter'
  | 'trending'
  | 'heart'
  | 'bookmark'
  | 'flame'
  | 'music'
  | 'trophy'
  | 'rocket'
  | 'gamepad'
  | 'book'
  | 'party'
  | 'smile'
  | 'coffee'
  | 'leaf'
  | 'moon'
  | 'sun'
  | 'crown'
  | 'ghost'
  | 'camera'
  | 'home'
  | 'mountain'
  | 'school';

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
  { key: 'star', label: 'Star', Icon: StarIcon },
  { key: 'sparkles', label: 'Sparkles', Icon: SparklesIcon },
  { key: 'tag', label: 'Tag', Icon: TagIcon },
  { key: 'ticket', label: 'Ticket', Icon: TicketIcon },
  { key: 'watch', label: 'Watched', Icon: WatchedIcon },
  { key: 'shield', label: 'Shield', Icon: ShieldIcon },
  { key: 'globe', label: 'Globe', Icon: GlobeIcon },
  { key: 'search', label: 'Search', Icon: SearchIcon },
  { key: 'bell', label: 'Bell', Icon: BellIcon },
  { key: 'birthday', label: 'Cake', Icon: BirthdayIcon },
  { key: 'edit', label: 'Edit', Icon: EditIcon },
  { key: 'clipboard', label: 'Clipboard', Icon: ClipboardIcon },
  { key: 'share', label: 'Share', Icon: ShareIcon },
  { key: 'filter', label: 'Filter', Icon: FilterIcon },
  { key: 'trending', label: 'Trending', Icon: TrendingIcon },
  { key: 'heart', label: 'Heart', Icon: Heart },
  { key: 'bookmark', label: 'Bookmark', Icon: Bookmark },
  { key: 'flame', label: 'Flame', Icon: Flame },
  { key: 'music', label: 'Music', Icon: Music2 },
  { key: 'trophy', label: 'Trophy', Icon: Trophy },
  { key: 'rocket', label: 'Rocket', Icon: Rocket },
  { key: 'gamepad', label: 'Games', Icon: Gamepad2 },
  { key: 'book', label: 'Books', Icon: BookOpen },
  { key: 'party', label: 'Party', Icon: PartyPopper },
  { key: 'smile', label: 'Smile', Icon: Smile },
  { key: 'coffee', label: 'Coffee', Icon: Coffee },
  { key: 'leaf', label: 'Leaf', Icon: Leaf },
  { key: 'moon', label: 'Moon', Icon: MoonStar },
  { key: 'sun', label: 'Sun', Icon: SunMedium },
  { key: 'crown', label: 'Crown', Icon: Crown },
  { key: 'ghost', label: 'Ghost', Icon: Ghost },
  { key: 'camera', label: 'Camera', Icon: Camera },
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'mountain', label: 'Mountain', Icon: Mountain },
  { key: 'school', label: 'School', Icon: GraduationCap },
];

const COMPACT_ICON_KEYS: WatchlistIconKey[] = [
  'folder',
  'film',
  'tv',
  'star',
  'sparkles',
  'tag',
  'ticket',
  'watch',
  'shield',
  'globe',
  'search',
  'bell',
  'birthday',
  'edit',
  'clipboard',
  'share',
  'filter',
  'trending',
  'heart',
  'bookmark',
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
  const [showMore, setShowMore] = useState(false);

  const compactOptions = useMemo(
    () => COMPACT_ICON_KEYS.map((key) => getWatchlistIconOption(key)),
    []
  );

  const remainingOptions = useMemo(
    () => WATCHLIST_ICON_OPTIONS.filter((option) => !COMPACT_ICON_KEYS.includes(option.key)),
    []
  );

  const renderOption = (option: WatchlistIconOption, isSelected: boolean) => {
    const Icon = option.Icon;
    return (
      <button
        key={option.key}
        type="button"
        onClick={() => onSelect(option.key)}
        className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-all duration-150 ${isSelected ? 'border-brand-primary bg-brand-primary/10 text-white' : 'border-white/10 bg-white/5 text-brand-text-light hover:border-white/20 hover:bg-white/10 hover:text-white'}`}
        aria-label={option.label}
        title={option.label}
      >
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isSelected ? 'bg-white/10' : 'bg-black/20'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-medium leading-none truncate w-full text-center">{option.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{compactLabel}</p>
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
        >
          {showMore ? 'Show fewer' : 'More icons'}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {compactOptions.map((option) => renderOption(option, option.key === selectedIcon))}
      </div>

      {showMore && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-text-dark">Full icon library</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {remainingOptions.map((option) => renderOption(option, option.key === selectedIcon))}
          </div>
        </div>
      )}
    </div>
  );
}
