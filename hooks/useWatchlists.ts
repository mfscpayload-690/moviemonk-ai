import { useCallback, useEffect, useRef, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';
import {
  addFolderToWatchlists,
  findFolderItem,
  loadWatchlistsFromStorage,
  saveMovieToFolder,
  saveWatchlistsToStorage
} from './watchlistStore';

export function useWatchlists() {
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const hydratedRef = useRef(false);

  const loadFromStorage = useCallback((): WatchlistFolder[] => {
    try {
      return loadWatchlistsFromStorage(localStorage);
    } catch (e) {
      console.warn('Failed to load watchlists', e);
      return [];
    }
  }, []);

  // Hydrate from storage once on mount
  useEffect(() => {
    const initial = loadFromStorage();
    setFolders(initial);
    hydratedRef.current = true;
  }, [loadFromStorage]);

  // Persist to storage after hydration
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      saveWatchlistsToStorage(localStorage, folders);
    } catch (e) {
      console.warn('Failed to save watchlists', e);
    }
  }, [folders]);

  // Use functional updates so add + save in one tick do not clobber state
  const persist = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setFolders(prev => updater(prev));
  };

  const addFolder = (name: string, color: string) => {
    const { folderId, next } = addFolderToWatchlists(folders, name, color);
    if (!folderId) return null;
    setFolders(next);
    return folderId;
  };

  const saveToFolder = (folderId: string, movie: MovieData, savedTitle?: string) => {
    persist(prev => saveMovieToFolder(prev, folderId, movie, savedTitle));
  };

  const renameFolder = (folderId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist(prev => prev.map(f => f.id === folderId ? { ...f, name: trimmed } : f));
  };

  const setFolderColor = (folderId: string, color: string) => {
    const nextColor = color && color.trim() ? color : undefined;
    if (!nextColor) return;
    persist(prev => prev.map(f => f.id === folderId ? { ...f, color: nextColor } : f));
  };

  const moveItem = (fromFolderId: string, itemId: string, toFolderId: string) => {
    if (!fromFolderId || !toFolderId || !itemId) return;
    if (fromFolderId === toFolderId) return; // no-op

    persist(prev => {
      const from = prev.find(f => f.id === fromFolderId);
      const to = prev.find(f => f.id === toFolderId);
      if (!from || !to) return prev;
      const idx = from.items.findIndex(i => i.id === itemId);
      if (idx === -1) return prev;
      const item = from.items[idx];
      const updatedFrom = { ...from, items: from.items.filter(i => i.id !== itemId) };
      const updatedTo = { ...to, items: [item, ...to.items] };
      return prev.map(f => {
        if (f.id === fromFolderId) return updatedFrom;
        if (f.id === toFolderId) return updatedTo;
        return f;
      });
    });
  };

  const deleteItem = (folderId: string, itemId: string) => {
    if (!folderId || !itemId) return;
    persist(prev => prev.map(f => 
      f.id === folderId 
        ? { ...f, items: f.items.filter(i => i.id !== itemId) }
        : f
    ));
  };

  const refresh = useCallback(() => {
    const fromStorage = loadFromStorage();
    setFolders(fromStorage);
  }, [loadFromStorage]);

  const findItem = (folderId: string, itemId: string) => {
    return findFolderItem(folders, folderId, itemId);
  };

  return {
    folders,
    addFolder,
    saveToFolder,
    findItem,
    refresh,
    renameFolder,
    setFolderColor,
    moveItem,
    deleteItem
  };
}
