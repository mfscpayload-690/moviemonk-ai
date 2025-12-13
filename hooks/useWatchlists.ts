import { useEffect, useState } from 'react';
import { MovieData, WatchlistFolder, WatchlistItem } from '../types';

const STORAGE_KEY = 'moviemonk_watchlists_v1';

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getMovieKey = (movie: MovieData) => {
  if (movie.tmdb_id) return `tmdb:${movie.tmdb_id}`;
  return `${movie.title}-${movie.year}-${movie.type}`.toLowerCase();
};

export function useWatchlists() {
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);

  // Load from storage on client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFolders(parsed);
      }
    } catch (e) {
      console.warn('Failed to load watchlists', e);
    }
  }, []);

  // Use functional updates so add + save in one tick do not clobber state
  const persist = (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
    setFolders(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save watchlists', e);
      }
      return next;
    });
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
    findItem
  };
}
