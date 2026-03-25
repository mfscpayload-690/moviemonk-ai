import { MovieData, WatchlistFolder, WatchlistItem } from '../types';

export const WATCHLIST_STORAGE_KEY = 'moviemonk_watchlists_v1';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

export function loadWatchlistsFromStorage(storage: Pick<Storage, 'getItem'>): WatchlistFolder[] {
  try {
    const raw = storage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlistsToStorage(
  storage: Pick<Storage, 'setItem'>,
  folders: WatchlistFolder[]
): void {
  storage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(folders));
}

export function addFolderToWatchlists(
  folders: WatchlistFolder[],
  name: string,
  color: string
): { next: WatchlistFolder[]; folderId: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { next: folders, folderId: null };
  const folderId = generateId();
  return {
    next: [{ id: folderId, name: trimmed, color: color || '#7c3aed', items: [] }, ...folders],
    folderId
  };
}

export function saveMovieToFolder(
  folders: WatchlistFolder[],
  folderId: string,
  movie: MovieData,
  savedTitle?: string
): WatchlistFolder[] {
  if (!folderId || !movie) return folders;
  const key = getMovieKey(movie);
  const title = (savedTitle && savedTitle.trim()) || movie.title;
  const now = new Date().toISOString();

  return folders.map(folder => {
    if (folder.id !== folderId) return folder;
    const existingIdx = folder.items.findIndex(i => getMovieKey(i.movie) === key);
    const item: WatchlistItem = {
      id: existingIdx >= 0 ? folder.items[existingIdx].id : generateId(),
      saved_title: title,
      movie: { ...movie },
      added_at: now
    };
    if (existingIdx >= 0) {
      const items = [...folder.items];
      items[existingIdx] = item;
      return { ...folder, items };
    }
    return { ...folder, items: [item, ...folder.items] };
  });
}

export function findFolderItem(
  folders: WatchlistFolder[],
  folderId: string,
  itemId: string
): { folder: WatchlistFolder; item: WatchlistItem } | null {
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return null;
  const item = folder.items.find(i => i.id === itemId);
  if (!item) return null;
  return { folder, item };
}