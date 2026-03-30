import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { WatchedTitle } from '../types';

function getSupabaseOrThrow() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

export async function fetchWatchedTitles(userId: string): Promise<WatchedTitle[]> {
  const client = getSupabaseOrThrow();
  const { data, error } = await client
    .from('watched_titles')
    .select('id, user_id, tmdb_id, media_type, title, poster_url, year, watched_at')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false });

  if (error) throw error;
  return (data || []) as WatchedTitle[];
}

export async function markWatchedCloud(
  userId: string,
  entry: Omit<WatchedTitle, 'id' | 'user_id' | 'watched_at'>
): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client.from('watched_titles').upsert(
    {
      user_id: userId,
      tmdb_id: entry.tmdb_id,
      media_type: entry.media_type,
      title: entry.title,
      poster_url: entry.poster_url || null,
      year: entry.year || null,
      watched_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,tmdb_id,media_type' }
  );
  if (error) throw error;
}

export async function unmarkWatchedCloud(
  userId: string,
  tmdbId: string,
  mediaType: string
): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client
    .from('watched_titles')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);
  if (error) throw error;
}

/** Bulk upload (for guest → cloud migration) */
export async function uploadWatchedToCloud(
  userId: string,
  entries: Omit<WatchedTitle, 'user_id'>[]
): Promise<void> {
  if (!entries.length) return;
  const client = getSupabaseOrThrow();
  const rows = entries.map((e) => ({
    user_id: userId,
    tmdb_id: e.tmdb_id,
    media_type: e.media_type,
    title: e.title,
    poster_url: e.poster_url || null,
    year: e.year || null,
    watched_at: e.watched_at || new Date().toISOString(),
  }));
  const { error } = await client
    .from('watched_titles')
    .upsert(rows, { onConflict: 'user_id,tmdb_id,media_type' });
  if (error) throw error;
}
