import { useCallback, useEffect, useMemo, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';
import { useWatchlists } from './useWatchlists';
import { WATCHLIST_STORAGE_KEY, loadWatchlistsFromStorage, saveWatchlistsToStorage } from './watchlistStore';
import { useAuth } from '../contexts/AuthContext';
import {
  addCloudFolder,
  deleteCloudFolder,
  deleteCloudItem,
  fetchCloudWatchlists,
  renameCloudFolder,
  saveCloudItem,
  updateCloudFolderColor
} from '../services/watchlistSync';
import { supabase } from '../lib/supabase';

const CLOUD_MIGRATION_EVENT = 'watchlists:cloud-migrated';

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

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

  const refreshCloud = useCallback(async () => {
    if (!user?.id) return;
    setCloudLoading(true);
    try {
      const folders = await fetchCloudWatchlists(user.id);
      setCloudFolders(folders);
    } catch (error) {
      console.warn('Failed to refresh cloud watchlists', error);
    } finally {
      setCloudLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    refreshCloud();
  }, [user?.id, refreshCloud]);

  useEffect(() => {
    if (!user?.id) return;
    const handleMigration = () => {
      refreshCloud();
    };
    window.addEventListener(CLOUD_MIGRATION_EVENT, handleMigration);
    return () => window.removeEventListener(CLOUD_MIGRATION_EVENT, handleMigration);
  }, [user?.id, refreshCloud]);

  const updateCloudState = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setCloudFolders((prev) => updater(prev));
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
      addFolder: (name: string, color: string) => {
        const trimmed = name.trim();
        if (!trimmed || !user?.id) return null;
        const folderId = crypto.randomUUID();
        const nextFolder: WatchlistFolder = {
          id: folderId,
          name: trimmed,
          color: color || '#7c3aed',
          items: []
        };
        updateCloudState((prev) => [nextFolder, ...prev]);
        void addCloudFolder(user.id, trimmed, nextFolder.color, folderId).catch((error) => {
          console.warn('Failed to add cloud folder', error);
          updateCloudState((prev) => prev.filter((folder) => folder.id !== folderId));
        });
        return folderId;
      },
      saveToFolder: (folderId: string, movie: MovieData, savedTitle?: string) => {
        if (!folderId || !movie) return;
        const now = new Date().toISOString();
        const itemId = crypto.randomUUID();
        const key = getMovieKey(movie);
        const item: WatchlistItem = {
          id: itemId,
          saved_title: (savedTitle && savedTitle.trim()) || movie.title,
          movie: { ...movie },
          added_at: now
        };

        updateCloudState((prev) =>
          prev.map((folder) => {
            if (folder.id !== folderId) return folder;
            const existingIdx = folder.items.findIndex((entry) => getMovieKey(entry.movie) === key);
            if (existingIdx >= 0) {
              const existingId = folder.items[existingIdx].id;
              const items = [...folder.items];
              items[existingIdx] = { ...item, id: existingId };
              return { ...folder, items };
            }
            return { ...folder, items: [item, ...folder.items] };
          })
        );

        void saveCloudItem(folderId, item).catch((error) => {
          console.warn('Failed to save cloud item', error);
          refreshCloud();
        });
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
      }
    }),
    [cloudFolders, refreshCloud, user?.id]
  );

  if (!user) {
    return {
      folders: local.folders,
      addFolder: local.addFolder,
      saveToFolder: local.saveToFolder,
      findItem: local.findItem,
      refresh: local.refresh,
      renameFolder: local.renameFolder,
      setFolderColor: local.setFolderColor,
      moveItem: local.moveItem,
      deleteItem: local.deleteItem,
      deleteFolder: deleteLocalFolder,
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
