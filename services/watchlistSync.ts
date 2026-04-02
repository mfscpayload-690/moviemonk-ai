import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { WatchlistFolder, WatchlistItem } from '../types';
import { WATCHLIST_DEFAULT_ICON } from '../hooks/watchlistStore';

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
  icon?: string | null;
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

function getSupabaseOrThrow() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

export async function fetchCloudWatchlists(userId: string): Promise<WatchlistFolder[]> {
  const client = getSupabaseOrThrow();
  let folderRows: any[] | null = null;
  let folderError: any = null;

  const folderQueryWithIcon = await client
    .from('watchlist_folders')
    .select('id, user_id, name, color, icon, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  folderRows = folderQueryWithIcon.data;
  folderError = folderQueryWithIcon.error;

  if (folderError && /column .*icon|icon does not exist|schema cache/i.test(String(folderError?.message || folderError))) {
    const fallbackQuery = await client
      .from('watchlist_folders')
      .select('id, user_id, name, color, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    folderRows = fallbackQuery.data;
    folderError = fallbackQuery.error;
  }

  if (folderError) throw folderError;
  if (!folderRows || folderRows.length === 0) return [];

  const folderIds = folderRows.map((folder) => folder.id);
  const { data: itemRows, error: itemError } = await client
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
    icon: folder.icon || WATCHLIST_DEFAULT_ICON,
    items: itemsByFolder.get(folder.id) || []
  }));
}

export async function uploadWatchlistsToCloud(userId: string, folders: WatchlistFolder[]): Promise<void> {
  const client = getSupabaseOrThrow();
  for (const folder of folders) {
    const folderId = ensureUuid(folder.id);
    const payload: Record<string, any> = {
      id: folderId,
      user_id: userId,
      name: folder.name,
      color: folder.color || '#7c3aed',
      icon: folder.icon || WATCHLIST_DEFAULT_ICON,
    };

    let { error: folderError } = await client.from('watchlist_folders').upsert(
      {
        ...payload
      },
      { onConflict: 'id' }
    );

    if (folderError && /column .*icon|icon does not exist|schema cache/i.test(String(folderError?.message || folderError))) {
      delete payload.icon;
      const retry = await client.from('watchlist_folders').upsert(payload, { onConflict: 'id' });
      folderError = retry.error;
    }

    if (folderError) throw folderError;

    for (const item of folder.items || []) {
      const itemId = ensureUuid(item.id);
      const { error: itemError } = await client.from('watchlist_items').upsert(
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
  icon = WATCHLIST_DEFAULT_ICON,
  folderId = crypto.randomUUID()
): Promise<string> {
  const client = getSupabaseOrThrow();
  const safeId = ensureUuid(folderId);
  const payload: Record<string, any> = {
    id: safeId,
    user_id: userId,
    name: name.trim(),
    color: color || '#7c3aed',
    icon,
  };

  let { error } = await client.from('watchlist_folders').insert(payload);

  if (error && /column .*icon|icon does not exist|schema cache/i.test(String(error?.message || error))) {
    delete payload.icon;
    const retry = await client.from('watchlist_folders').insert(payload);
    error = retry.error;
  }

  if (error) throw error;
  return safeId;
}

export async function saveCloudItem(folderId: string, item: WatchlistItem): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client.from('watchlist_items').upsert(
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
  const client = getSupabaseOrThrow();
  const { error } = await client.from('watchlist_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function renameCloudFolder(folderId: string, name: string): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client
    .from('watchlist_folders')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function updateCloudFolderColor(folderId: string, color: string): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client
    .from('watchlist_folders')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', folderId);
  if (error) throw error;
}

export async function updateCloudFolderIcon(folderId: string, icon: string): Promise<void> {
  const client = getSupabaseOrThrow();
  let { error } = await client
    .from('watchlist_folders')
    .update({ icon, updated_at: new Date().toISOString() })
    .eq('id', folderId);

  // If the icon column is not deployed yet, treat as non-fatal.
  if (error && /column .*icon|icon does not exist|schema cache/i.test(String(error?.message || error))) {
    error = null;
  }

  if (error) throw error;
}

export async function deleteCloudFolder(folderId: string): Promise<void> {
  const client = getSupabaseOrThrow();
  const { error } = await client.from('watchlist_folders').delete().eq('id', folderId);
  if (error) throw error;
}
