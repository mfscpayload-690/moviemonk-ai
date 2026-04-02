import {
  WATCHLIST_DEFAULT_ICON,
  addFolderToWatchlists,
  loadWatchlistsFromStorage
} from '../../hooks/watchlistStore';

describe('hooks/watchlistStore icon behavior', () => {
  it('normalizes legacy folders without an icon', () => {
    const storage = {
      getItem: () =>
        JSON.stringify([
          { id: '1', name: 'Legacy', color: '#111111', items: [] },
          { id: '2', name: 'Empty icon', color: '#222222', icon: '   ', items: [] }
        ])
    };

    const folders = loadWatchlistsFromStorage(storage as any);
    expect(folders).toHaveLength(2);
    expect(folders[0].icon).toBe(WATCHLIST_DEFAULT_ICON);
    expect(folders[1].icon).toBe(WATCHLIST_DEFAULT_ICON);
  });

  it('stores icon when adding a folder', () => {
    const result = addFolderToWatchlists([], 'Weekend Picks', '#7c3aed', 'heart');
    expect(result.folderId).toBeTruthy();
    expect(result.next).toHaveLength(1);
    expect(result.next[0].icon).toBe('heart');
  });
});
