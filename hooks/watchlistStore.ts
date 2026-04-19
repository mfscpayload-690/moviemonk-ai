import { MovieData, WatchlistFolder, WatchlistItem, WatchlistSaveReceipt } from '../types';

export const WATCHLIST_STORAGE_KEY = 'moviemonk_watchlists_v1';
export const WATCHLIST_ORDER_STORAGE_KEY = 'moviemonk_watchlist_order_v1';
export const WATCHLIST_DEFAULT_ICON = 'folder';

export type WatchlistOrderState = {
  folderIds: string[];
  itemIdsByFolder: Record<string, string[]>;
};

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

const normalizeFolder = (folder: any): WatchlistFolder | null => {
  if (!folder || typeof folder !== 'object') return null;
  if (!folder.id || !folder.name) return null;
  const items = Array.isArray(folder.items) ? folder.items : [];
  return {
    id: String(folder.id),
    name: String(folder.name),
    icon: typeof folder.icon === 'string' && folder.icon.trim() ? folder.icon : WATCHLIST_DEFAULT_ICON,
    items
  };
};

export function loadWatchlistsFromStorage(storage: Pick<Storage, 'getItem'>): WatchlistFolder[] {
  try {
    const raw = storage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(normalizeFolder).filter((folder): folder is WatchlistFolder => Boolean(folder))
      : [];
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

function safeOrderParse(value: string | null): WatchlistOrderState {
  if (!value) {
    return { folderIds: [], itemIdsByFolder: {} };
  }

  try {
    const parsed = JSON.parse(value);
    return {
      folderIds: Array.isArray(parsed?.folderIds) ? parsed.folderIds.map(String) : [],
      itemIdsByFolder: typeof parsed?.itemIdsByFolder === 'object' && parsed?.itemIdsByFolder
        ? Object.fromEntries(
            Object.entries(parsed.itemIdsByFolder).map(([folderId, itemIds]) => [
              String(folderId),
              Array.isArray(itemIds) ? itemIds.map(String) : []
            ])
          )
        : {}
    };
  } catch {
    return { folderIds: [], itemIdsByFolder: {} };
  }
}

export function loadWatchlistOrderState(storage: Pick<Storage, 'getItem'>): WatchlistOrderState {
  return safeOrderParse(storage.getItem(WATCHLIST_ORDER_STORAGE_KEY));
}

export function saveWatchlistOrderState(
  storage: Pick<Storage, 'setItem'>,
  state: WatchlistOrderState
): void {
  storage.setItem(WATCHLIST_ORDER_STORAGE_KEY, JSON.stringify(state));
}

export function applyWatchlistOrder(
  folders: WatchlistFolder[],
  state: WatchlistOrderState
): WatchlistFolder[] {
  const folderOrder = new Map(state.folderIds.map((id, index) => [id, index]));

  const orderedFolders = [...folders].sort((a, b) => {
    const aIndex = folderOrder.get(a.id);
    const bIndex = folderOrder.get(b.id);
    if (typeof aIndex === 'number' && typeof bIndex === 'number') return aIndex - bIndex;
    if (typeof aIndex === 'number') return -1;
    if (typeof bIndex === 'number') return 1;
    return 0;
  });

  return orderedFolders.map((folder) => {
    const itemIds = state.itemIdsByFolder[folder.id] || [];
    if (itemIds.length === 0) return folder;

    const itemOrder = new Map(itemIds.map((id, index) => [id, index]));
    return {
      ...folder,
      items: [...folder.items].sort((a, b) => {
        const aIndex = itemOrder.get(a.id);
        const bIndex = itemOrder.get(b.id);
        if (typeof aIndex === 'number' && typeof bIndex === 'number') return aIndex - bIndex;
        if (typeof aIndex === 'number') return -1;
        if (typeof bIndex === 'number') return 1;
        return 0;
      })
    };
  });
}

export function buildWatchlistOrderState(folders: WatchlistFolder[]): WatchlistOrderState {
  return {
    folderIds: folders.map((folder) => folder.id),
    itemIdsByFolder: Object.fromEntries(
      folders.map((folder) => [folder.id, folder.items.map((item) => item.id)])
    )
  };
}

export function reorderByIds<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return items;

  const next = [...items];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

export function addFolderToWatchlists(
  folders: WatchlistFolder[],
  name: string,
  icon?: string
): { next: WatchlistFolder[]; folderId: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { next: folders, folderId: null };
  const folderId = generateId();
  return {
    next: [{ id: folderId, name: trimmed, icon: icon || WATCHLIST_DEFAULT_ICON, items: [] }, ...folders],
    folderId
  };
}

export function saveMovieToFolder(
  folders: WatchlistFolder[],
  folderId: string,
  movie: MovieData,
  savedTitle?: string
): WatchlistFolder[] {
  return saveMovieToFolderWithReceipt(folders, folderId, movie, savedTitle).next;
}

export function saveMovieToFolderWithReceipt(
  folders: WatchlistFolder[],
  folderId: string,
  movie: MovieData,
  savedTitle?: string
): { next: WatchlistFolder[]; receipt: WatchlistSaveReceipt | null } {
  if (!folderId || !movie) return { next: folders, receipt: null };
  const key = getMovieKey(movie);
  const title = (savedTitle && savedTitle.trim()) || movie.title;
  const now = new Date().toISOString();
  let receipt: WatchlistSaveReceipt | null = null;

  const next = folders.map(folder => {
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
      const previousItem = items[existingIdx];
      items[existingIdx] = item;
      receipt = {
        folderId,
        itemId: item.id,
        mode: 'replace',
        nextItem: item,
        previousItem
      };
      return { ...folder, items };
    }
    receipt = {
      folderId,
      itemId: item.id,
      mode: 'insert',
      nextItem: item
    };
    return { ...folder, items: [item, ...folder.items] };
  });

  return { next, receipt };
}

export function rollbackWatchlistSave(
  folders: WatchlistFolder[],
  receipt: WatchlistSaveReceipt
): WatchlistFolder[] {
  return folders.map((folder) => {
    if (folder.id !== receipt.folderId) return folder;

    if (receipt.mode === 'insert') {
      return {
        ...folder,
        items: folder.items.filter((item) => item.id !== receipt.itemId)
      };
    }

    if (!receipt.previousItem) return folder;

    return {
      ...folder,
      items: folder.items.map((item) => (
        item.id === receipt.itemId ? receipt.previousItem! : item
      ))
    };
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
