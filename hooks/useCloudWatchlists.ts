import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistSaveReceipt } from '../types';
import { useWatchlists } from './useWatchlists';
import {
  applyWatchlistOrder,
  buildWatchlistOrderState,
  WATCHLIST_DEFAULT_ICON,
  WATCHLIST_STORAGE_KEY,
  loadWatchlistOrderState,
  loadWatchlistsFromStorage,
  reorderByIds,
  rollbackWatchlistSave,
  saveMovieToFolderWithReceipt,
  saveWatchlistOrderState,
  saveWatchlistsToStorage
} from './watchlistStore';
import { useAuth } from '../contexts/AuthContext';
import {
  addCloudFolder,
  deleteCloudFolder,
  deleteCloudItem,
  fetchCloudWatchlists,
  renameCloudFolder,
  saveCloudItem,
  updateCloudFolderIcon,
  updateCloudFolderColor
} from '../services/watchlistSync';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const CLOUD_MIGRATION_EVENT = 'watchlists:cloud-migrated';
const CLOUD_CACHE_PREFIX = 'moviemonk_cloud_watchlists_cache_v1';

function toCloudCacheKey(userId: string): string {
  return `${CLOUD_CACHE_PREFIX}:${userId}`;
}

function readCloudCache(userId: string): WatchlistFolder[] {
  try {
    const raw = localStorage.getItem(toCloudCacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return applyWatchlistOrder(parsed as WatchlistFolder[], loadWatchlistOrderState(localStorage));
  } catch (error) {
    console.warn('Failed to read cloud watchlist cache', error);
    return [];
  }
}

function writeCloudCache(userId: string, folders: WatchlistFolder[]) {
  try {
    localStorage.setItem(toCloudCacheKey(userId), JSON.stringify(folders));
  } catch (error) {
    console.warn('Failed to write cloud watchlist cache', error);
  }
}

function findItemInFolders(folders: WatchlistFolder[], folderId: string, itemId: string) {
  const folder = folders.find((entry) => entry.id === folderId);
  if (!folder) return null;
  const item = folder.items.find((entry) => entry.id === itemId);
  if (!item) return null;
  return { folder, item };
}

export function useCloudWatchlists() {
  const local = useWatchlists();
  const { user } = useAuth();
  const [cloudFolders, setCloudFolders] = useState<WatchlistFolder[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const cloudCacheHydratedUserRef = useRef<string | null>(null);

  const refreshCloud = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setCloudLoading(true);
    try {
      const folders = applyWatchlistOrder(await fetchCloudWatchlists(user.id), loadWatchlistOrderState(localStorage));
      setCloudFolders(folders);
    } catch (error) {
      console.warn('Failed to refresh cloud watchlists', error);
    } finally {
      setCloudLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      setCloudFolders([]);
      cloudCacheHydratedUserRef.current = null;
      return;
    }
    const cached = readCloudCache(user.id);
    if (cached.length > 0) {
      setCloudFolders(cached);
    }
    cloudCacheHydratedUserRef.current = user.id;
    refreshCloud();
  }, [user?.id, refreshCloud]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    const handleMigration = () => {
      refreshCloud();
    };
    window.addEventListener(CLOUD_MIGRATION_EVENT, handleMigration);
    return () => window.removeEventListener(CLOUD_MIGRATION_EVENT, handleMigration);
  }, [user?.id, refreshCloud]);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    if (cloudCacheHydratedUserRef.current !== user.id) return;
    writeCloudCache(user.id, cloudFolders);
  }, [cloudFolders, user?.id]);

  const updateCloudState = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setCloudFolders((prev) => {
      const next = updater(prev);
      try {
        saveWatchlistOrderState(localStorage, buildWatchlistOrderState(next));
      } catch (error) {
        console.warn('Failed to persist cloud watchlist order', error);
      }
      return next;
    });
  };

  const deleteLocalFolder = useCallback(
    (folderId: string) => {
      const next = local.folders.filter((folder) => folder.id !== folderId);
      try {
        saveWatchlistsToStorage(localStorage, next);
      } catch (error) {
        console.warn('Failed to delete local folder', error);
      }
      local.refresh();
    },
    [local]
  );

  const cloudApi = useMemo(
    () => ({
      folders: cloudFolders,
      addFolder: (name: string, color: string, icon?: string) => {
        const trimmed = name.trim();
        if (!trimmed || !user?.id) return null;
        const folderId = crypto.randomUUID();
        const nextFolder: WatchlistFolder = {
          id: folderId,
          name: trimmed,
          color: color || '#7c3aed',
          icon: icon || WATCHLIST_DEFAULT_ICON,
          items: []
        };
        updateCloudState((prev) => [nextFolder, ...prev]);
        void addCloudFolder(user.id, trimmed, nextFolder.color, nextFolder.icon, folderId).catch((error) => {
          console.warn('Failed to add cloud folder', error);
          updateCloudState((prev) => prev.filter((folder) => folder.id !== folderId));
        });
        return folderId;
      },
      saveToFolder: async (folderId: string, movie: MovieData, savedTitle?: string) => {
        const result = saveMovieToFolderWithReceipt(cloudFolders, folderId, movie, savedTitle);
        if (!result.receipt) {
          throw new Error('Failed to save title to watchlist');
        }

        updateCloudState(() => result.next);

        try {
          await saveCloudItem(folderId, result.receipt.nextItem);
          return result.receipt;
        } catch (error) {
          console.warn('Failed to save cloud item', error);
          refreshCloud();
          throw error;
        }
      },
      rollbackSave: async (receipt: WatchlistSaveReceipt) => {
        updateCloudState((prev) => rollbackWatchlistSave(prev, receipt));

        try {
          if (receipt.mode === 'insert') {
            await deleteCloudItem(receipt.itemId);
            return;
          }

          if (!receipt.previousItem) return;
          await saveCloudItem(receipt.folderId, receipt.previousItem);
        } catch (error) {
          console.warn('Failed to roll back cloud save', error);
          refreshCloud();
          throw error;
        }
      },
      findItem: (folderId: string, itemId: string) => findItemInFolders(cloudFolders, folderId, itemId),
      refresh: () => {
        void refreshCloud();
      },
      renameFolder: (folderId: string, name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        updateCloudState((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, name: trimmed } : folder)));
        void renameCloudFolder(folderId, trimmed).catch((error) => {
          console.warn('Failed to rename cloud folder', error);
          refreshCloud();
        });
      },
      setFolderColor: (folderId: string, color: string) => {
        if (!color) return;
        updateCloudState((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, color } : folder)));
        void updateCloudFolderColor(folderId, color).catch((error) => {
          console.warn('Failed to update cloud folder color', error);
          refreshCloud();
        });
      },
      setFolderIcon: (folderId: string, icon: string) => {
        if (!icon) return;
        updateCloudState((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, icon } : folder)));
        void updateCloudFolderIcon(folderId, icon).catch((error) => {
          console.warn('Failed to update cloud folder icon', error);
          refreshCloud();
        });
      },
      moveItem: (fromFolderId: string, itemId: string, toFolderId: string) => {
        if (!fromFolderId || !toFolderId || !itemId || fromFolderId === toFolderId) return;
        const movedItem = findItemInFolders(cloudFolders, fromFolderId, itemId)?.item;
        if (!movedItem) return;

        updateCloudState((prev) =>
          prev.map((folder) => {
            if (folder.id === fromFolderId) {
              return { ...folder, items: folder.items.filter((entry) => entry.id !== itemId) };
            }
            if (folder.id === toFolderId) {
              return { ...folder, items: [movedItem, ...folder.items] };
            }
            return folder;
          })
        );

        void (async () => {
          if (!isSupabaseConfigured || !supabase) {
            throw new Error('Supabase is not configured');
          }
          const { error } = await supabase
            .from('watchlist_items')
            .update({ folder_id: toFolderId })
            .eq('id', itemId);
          if (error) throw error;
        })().catch((error) => {
          console.warn('Failed to move cloud item', error);
          refreshCloud();
        });
      },
      deleteItem: (folderId: string, itemId: string) => {
        if (!folderId || !itemId) return;
        updateCloudState((prev) =>
          prev.map((folder) =>
            folder.id === folderId
              ? { ...folder, items: folder.items.filter((entry) => entry.id !== itemId) }
              : folder
          )
        );
        void deleteCloudItem(itemId).catch((error) => {
          console.warn('Failed to delete cloud item', error);
          refreshCloud();
        });
      },
      deleteFolder: (folderId: string) => {
        if (!folderId) return;
        updateCloudState((prev) => prev.filter((folder) => folder.id !== folderId));
        void deleteCloudFolder(folderId).catch((error) => {
          console.warn('Failed to delete cloud folder', error);
          refreshCloud();
        });
      },
      reorderFolders: (activeId: string, overId: string) => {
        if (!activeId || !overId) return;
        updateCloudState((prev) => reorderByIds(prev, activeId, overId));
      },
      reorderItems: (folderId: string, activeId: string, overId: string) => {
        if (!folderId || !activeId || !overId) return;
        updateCloudState((prev) => prev.map((folder) => (
          folder.id === folderId
            ? { ...folder, items: reorderByIds(folder.items, activeId, overId) }
            : folder
        )));
      }
    }),
    [cloudFolders, refreshCloud, user?.id]
  );

  if (!user || !isSupabaseConfigured) {
    return {
      folders: local.folders,
      addFolder: local.addFolder,
      saveToFolder: local.saveToFolder,
      rollbackSave: local.rollbackSave,
      findItem: local.findItem,
      refresh: local.refresh,
      renameFolder: local.renameFolder,
      setFolderColor: local.setFolderColor,
      setFolderIcon: local.setFolderIcon,
      moveItem: local.moveItem,
      deleteItem: local.deleteItem,
      deleteFolder: deleteLocalFolder,
      reorderFolders: local.reorderFolders,
      reorderItems: local.reorderItems,
      isCloud: false,
      isSyncing: false
    };
  }

  return {
    ...cloudApi,
    isCloud: true,
    isSyncing: cloudLoading
  };
}

export function hasLocalWatchlistData(): boolean {
  const folders = loadWatchlistsFromStorage(localStorage);
  return folders.length > 0;
}

export const WATCHLIST_MIGRATION_EVENT = CLOUD_MIGRATION_EVENT;
export { WATCHLIST_STORAGE_KEY };
