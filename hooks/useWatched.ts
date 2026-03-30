import { useCallback, useEffect, useRef, useState } from 'react';
import { WatchedTitle } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchWatchedTitles,
  markWatchedCloud,
  unmarkWatchedCloud,
  uploadWatchedToCloud,
} from '../services/watchedService';

const LS_KEY = 'moviemonk_watched';

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadLocalWatched(): WatchedTitle[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as WatchedTitle[]) : [];
  } catch {
    return [];
  }
}

function saveLocalWatched(items: WatchedTitle[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // storage full – silent
  }
}

function clearLocalWatched(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch { /* noop */ }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWatched() {
  const { user } = useAuth();
  const [watched, setWatched] = useState<WatchedTitle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const migrationAttempted = useRef(false);

  const isCloud = Boolean(user && isSupabaseConfigured);

  // Load on mount / user change
  useEffect(() => {
    if (isCloud && user?.id) {
      setIsLoading(true);
      fetchWatchedTitles(user.id)
        .then(setWatched)
        .catch(() => setWatched([]))
        .finally(() => setIsLoading(false));
    } else {
      setWatched(loadLocalWatched());
    }
  }, [isCloud, user?.id]);

  // Auto-migrate local → cloud on first sign-in
  useEffect(() => {
    if (!isCloud || !user?.id || migrationAttempted.current) return;
    migrationAttempted.current = true;

    const local = loadLocalWatched();
    if (local.length === 0) return;

    uploadWatchedToCloud(user.id, local)
      .then(() => {
        clearLocalWatched();
        return fetchWatchedTitles(user.id!);
      })
      .then((merged) => setWatched(merged))
      .catch(() => {
        // cloud failed – keep local state, don't clear local
      });
  }, [isCloud, user?.id]);

  // ── isWatched ──────────────────────────────────────────────────────────────
  const isWatched = useCallback(
    (tmdbId: string, mediaType: 'movie' | 'tv'): boolean =>
      watched.some((w) => w.tmdb_id === tmdbId && w.media_type === mediaType),
    [watched]
  );

  // ── toggle ─────────────────────────────────────────────────────────────────
  const toggle = useCallback(
    async (entry: Omit<WatchedTitle, 'id' | 'user_id' | 'watched_at'>) => {
      const already = watched.some(
        (w) => w.tmdb_id === entry.tmdb_id && w.media_type === entry.media_type
      );

      if (already) {
        // Optimistic remove
        setWatched((prev) =>
          prev.filter(
            (w) =>
              !(w.tmdb_id === entry.tmdb_id && w.media_type === entry.media_type)
          )
        );

        if (isCloud && user?.id) {
          unmarkWatchedCloud(user.id, entry.tmdb_id, entry.media_type).catch(
            () => {
              // revert on error
              setWatched((prev) => [
                { ...entry, watched_at: new Date().toISOString() },
                ...prev,
              ]);
            }
          );
        } else {
          const next = loadLocalWatched().filter(
            (w) =>
              !(w.tmdb_id === entry.tmdb_id && w.media_type === entry.media_type)
          );
          saveLocalWatched(next);
        }
      } else {
        // Optimistic add
        const newEntry: WatchedTitle = {
          ...entry,
          watched_at: new Date().toISOString(),
        };
        setWatched((prev) => [newEntry, ...prev]);

        if (isCloud && user?.id) {
          markWatchedCloud(user.id, entry).catch(() => {
            // revert on error
            setWatched((prev) =>
              prev.filter(
                (w) =>
                  !(
                    w.tmdb_id === entry.tmdb_id &&
                    w.media_type === entry.media_type
                  )
              )
            );
          });
        } else {
          const next = [newEntry, ...loadLocalWatched()];
          saveLocalWatched(next);
        }
      }
    },
    [isCloud, user?.id, watched]
  );

  return {
    watched,
    isWatched,
    toggle,
    isLoading,
    watchedCount: watched.length,
  };
}
