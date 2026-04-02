import { MovieData, WatchlistFolder } from '../types';

export type QuickSaveTitle = {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year?: string;
  poster_url?: string | null;
};

export type QuickSaveState<IconKey extends string = string> = {
  target: QuickSaveTitle | null;
  folderId: string;
  newFolderName: string;
  newFolderColor: string;
  newFolderIcon: IconKey;
};

export const QUICK_SAVE_DEFAULT_COLOR = '#7c3aed';
export const QUICK_SAVE_DEFAULT_NAME = 'Watchlist';

export function resolvePreferredQuickSaveFolderId(folders: WatchlistFolder[]): string | null {
  if (folders.length === 0) return null;
  const preferredFolder = folders.find((folder) => /watchlist|saved|favorites?/i.test(folder.name));
  return preferredFolder?.id || folders[0]?.id || null;
}

export function getClosedQuickSaveState<IconKey extends string>(defaultIcon: IconKey): QuickSaveState<IconKey> {
  return {
    target: null,
    folderId: '',
    newFolderName: '',
    newFolderColor: QUICK_SAVE_DEFAULT_COLOR,
    newFolderIcon: defaultIcon
  };
}

export function getOpenedQuickSaveState<IconKey extends string>(
  title: QuickSaveTitle,
  folders: WatchlistFolder[],
  defaultIcon: IconKey
): QuickSaveState<IconKey> {
  return {
    target: title,
    folderId: resolvePreferredQuickSaveFolderId(folders) || '',
    newFolderName: folders.length === 0 ? QUICK_SAVE_DEFAULT_NAME : '',
    newFolderColor: QUICK_SAVE_DEFAULT_COLOR,
    newFolderIcon: defaultIcon
  };
}

export function canSubmitQuickSave(state: QuickSaveState): boolean {
  return Boolean(state.folderId || state.newFolderName.trim());
}

export function buildQuickMovieData(item: QuickSaveTitle): MovieData {
  return {
    tmdb_id: String(item.id),
    title: item.title,
    year: item.year || '',
    type: item.media_type === 'tv' ? 'show' : 'movie',
    media_type: item.media_type,
    genres: [],
    poster_url: item.poster_url || '',
    backdrop_url: '',
    trailer_url: '',
    ratings: [],
    cast: [],
    crew: { director: '', writer: '', music: '' },
    summary_short: '',
    summary_medium: '',
    summary_long_spoilers: '',
    suspense_breaker: '',
    where_to_watch: [],
    extra_images: [],
    ai_notes: ''
  };
}
