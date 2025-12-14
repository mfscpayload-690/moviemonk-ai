import { useCallback, useEffect, useRef, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';

const STORAGE_KEY = 'moviemonk_watchlists_v1';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

export function useWatchlists() {
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const hydratedRef = useRef(false);

  const loadFromStorage = useCallback((): WatchlistFolder[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    } catch (e) {
      console.warn('Failed to save watchlists', e);
    }
  }, [folders]);

  // Use functional updates so add + save in one tick do not clobber state
  const persist = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setFolders(prev => updater(prev));
  };

  const addFolder = (name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const folderId = generateId();
    persist(prev => [{ id: folderId, name: trimmed, color: color || '#7c3aed', items: [] }, ...prev]);
    return folderId;
  };

  const saveToFolder = (folderId: string, movie: MovieData, savedTitle?: string) => {
    if (!folderId || !movie) return;
    const key = getMovieKey(movie);
    const title = (savedTitle && savedTitle.trim()) || movie.title;
    const now = new Date().toISOString();

    persist(prev => prev.map(folder => {
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
    }));
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
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return null;
    const item = folder.items.find(i => i.id === itemId);
    if (!item) return null;
    return { folder, item };
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
