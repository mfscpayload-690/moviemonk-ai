import type { WatchedTitle, WatchlistFolder, WatchlistItem } from '../types';

export type WatchlistReminder = {
  id: string;
  folderId: string;
  folderName: string;
  itemId: string;
  mediaType: 'movie' | 'tv';
  tmdbId: string;
  title: string;
  year?: string;
  posterUrl?: string;
  daysSaved: number;
};

const DISMISSED_KEY = 'moviemonk_watchlist_reminders_dismissed_v1';

type DismissedStore = Record<string, string>;

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function parseDate(input?: string): number {
  if (!input) return Date.now();
  const value = Date.parse(input);
  return Number.isFinite(value) ? value : Date.now();
}

function daysSince(input?: string): number {
  const delta = Date.now() - parseDate(input);
  return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));
}

function mediaTypeOf(item: WatchlistItem): 'movie' | 'tv' {
  return item.movie.type === 'show' ? 'tv' : 'movie';
}

function tmdbIdOf(item: WatchlistItem): string {
  return String(item.movie.tmdb_id || '');
}

function watchedSet(entries: WatchedTitle[]): Set<string> {
  return new Set(entries.map((entry) => `${entry.media_type}:${entry.tmdb_id}`));
}

function loadDismissedStore(): DismissedStore {
  const storage = getStorage();
  if (!storage) return {};
  const raw = storage.getItem(DISMISSED_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as DismissedStore;
  } catch {
    return {};
  }
}

function saveDismissedStore(store: DismissedStore): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(DISMISSED_KEY, JSON.stringify(store));
}

export function dismissReminder(reminderId: string): void {
  if (!reminderId) return;
  const store = loadDismissedStore();
  store[reminderId] = new Date().toISOString();
  saveDismissedStore(store);
}

export function isReminderDismissed(reminderId: string, cooloffDays = 3): boolean {
  if (!reminderId) return false;
  const store = loadDismissedStore();
  const dismissedAt = store[reminderId];
  if (!dismissedAt) return false;
  return daysSince(dismissedAt) < cooloffDays;
}

export function deriveWatchlistReminders(
  folders: WatchlistFolder[],
  watchedEntries: WatchedTitle[],
  max = 5
): WatchlistReminder[] {
  const watchedLookup = watchedSet(watchedEntries);
  const reminders: WatchlistReminder[] = [];

  for (const folder of folders) {
    for (const item of folder.items) {
      const mediaType = mediaTypeOf(item);
      const tmdbId = tmdbIdOf(item);
      if (!tmdbId) continue;
      if (watchedLookup.has(`${mediaType}:${tmdbId}`)) continue;

      const reminderId = `${folder.id}:${item.id}`;
      if (isReminderDismissed(reminderId)) continue;

      const daysSaved = daysSince(item.added_at);
      if (daysSaved < 5) continue;

      reminders.push({
        id: reminderId,
        folderId: folder.id,
        folderName: folder.name,
        itemId: item.id,
        mediaType,
        tmdbId,
        title: item.movie.title,
        year: item.movie.year,
        posterUrl: item.movie.poster_url,
        daysSaved
      });
    }
  }

  reminders.sort((a, b) => b.daysSaved - a.daysSaved);
  return reminders.slice(0, max);
}

export function canNotifyWatchlistReminders(): boolean {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined';
}

export async function notifyReminder(reminder: WatchlistReminder): Promise<boolean> {
  if (!canNotifyWatchlistReminders()) return false;

  const permission = Notification.permission;
  let nextPermission = permission;
  if (permission === 'default') {
    nextPermission = await Notification.requestPermission();
  }
  if (nextPermission !== 'granted') return false;

  const body = `${reminder.title}${reminder.year ? ` (${reminder.year})` : ''} has been in "${reminder.folderName}" for ${reminder.daysSaved} days.`;
  const notification = new Notification('MovieMonk reminder', {
    body,
    tag: reminder.id,
    icon: reminder.posterUrl || '/favicon.ico'
  });
  notification.onclick = () => window.focus();
  return true;
}
