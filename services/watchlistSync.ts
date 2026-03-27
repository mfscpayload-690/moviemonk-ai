import { supabase } from '../lib/supabase';
import { WatchlistFolder, WatchlistItem } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureUuid(value?: string): string {
  if (value && UUID_PATTERN.test(value)) return value;
  return crypto.randomUUID();
}

function toCloudMediaType(mediaType?: string): string {
  if (!mediaType) return 'movie';
  if (mediaType === 'show') return 'tv';
  return mediaType;
}

type CloudFolderRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at?: string;
};

type CloudItemRow = {
  id: string;
  folder_id: string;
  tmdb_id: string | null;
  media_type: string | null;
  saved_title: string;
  movie_data: any;
  added_at?: string;
};

export async function fetchCloudWatchlists(userId: string): Promise<WatchlistFolder[]> {
  const { data: folderRows, error: folderError } = await supabase
    .from('watchlist_folders')
    .select('id, user_id, name, color, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (folderError) throw folderError;
  if (!folderRows || folderRows.length === 0) return [];

  const folderIds = folderRows.map((folder) => folder.id);
  const { data: itemRows, error: itemError } = await supabase
    .from('watchlist_items')
    .select('id, folder_id, tmdb_id, media_type, saved_title, movie_data, added_at')
    .in('folder_id', folderIds)
    .order('added_at', { ascending: false });

  if (itemError) throw itemError;

  const itemsByFolder = new Map<string, WatchlistItem[]>();
  (itemRows || []).forEach((row: CloudItemRow) => {
    const item: WatchlistItem = {
      id: row.id,
      saved_title: row.saved_title,
      movie: row.movie_data,
      added_at: row.added_at || new Date().toISOString()
    };
    const existing = itemsByFolder.get(row.folder_id) || [];
    existing.push(item);
    itemsByFolder.set(row.folder_id, existing);
  });

  return (folderRows as CloudFolderRow[]).map((folder) => ({
    id: folder.id,
    name: folder.name,
    color: folder.color || '#7c3aed',
    items: itemsByFolder.get(folder.id) || []
  }));
}

export async function uploadWatchlistsToCloud(userId: string, folders: WatchlistFolder[]): Promise<void> {
  for (const folder of folders) {
    const folderId = ensureUuid(folder.id);
    const { error: folderError } = await supabase.from('watchlist_folders').upsert(
      {
        id: folderId,
        user_id: userId,
        name: folder.name,
        color: folder.color || '#7c3aed'
      },
      { onConflict: 'id' }
    );

    if (folderError) throw folderError;

    for (const item of folder.items || []) {
      const itemId = ensureUuid(item.id);
      const { error: itemError } = await supabase.from('watchlist_items').upsert(
        {
          id: itemId,
          folder_id: folderId,
          tmdb_id: item.movie.tmdb_id || null,
          media_type: toCloudMediaType(item.movie.media_type || item.movie.type),
          saved_title: item.saved_title,
          movie_data: item.movie,
          added_at: item.added_at || new Date().toISOString()
        },
        { onConflict: 'id' }
      );
      if (itemError) throw itemError;
    }
  }
}

export async function addCloudFolder(
  userId: string,
  name: string,
  color: string,
  folderId = crypto.randomUUID()
): Promise<string> {
  const safeId = ensureUuid(folderId);
  const { error } = await supabase.from('watchlist_folders').insert({
    id: safeId,
    user_id: userId,
    name: name.trim(),
    color: color || '#7c3aed'
  });

  if (error) throw error;
  return safeId;
}

export async function saveCloudItem(folderId: string, item: WatchlistItem): Promise<void> {
  const { error } = await supabase.from('watchlist_items').upsert(
    {
      id: ensureUuid(item.id),
      folder_id: folderId,
      tmdb_id: item.movie.tmdb_id || null,
      media_type: toCloudMediaType(item.movie.media_type || item.movie.type),
      saved_title: item.saved_title,
      movie_data: item.movie,
      added_at: item.added_at || new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

export async function deleteCloudItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('watchlist_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function renameCloudFolder(folderId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist_folders')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function updateCloudFolderColor(folderId: string, color: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist_folders')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function deleteCloudFolder(folderId: string): Promise<void> {
  const { error } = await supabase.from('watchlist_folders').delete().eq('id', folderId);
  if (error) throw error;
}
