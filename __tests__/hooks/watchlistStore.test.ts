import {
  WATCHLIST_DEFAULT_ICON,
  addFolderToWatchlists,
  loadWatchlistsFromStorage,
  rollbackWatchlistSave,
  saveMovieToFolderWithReceipt
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

  it('returns an insert receipt and rolls it back cleanly', () => {
    const base = addFolderToWatchlists([], 'Friday Night', '#7c3aed', 'film').next;
    const movie = {
      tmdb_id: '42',
      title: 'Arrival',
      year: '2016',
      type: 'movie' as const,
      media_type: 'movie',
      genres: [],
      poster_url: '/arrival.jpg',
      backdrop_url: '',
      trailer_url: '',
      ratings: [],
      cast: [],
      crew: { director: '', writer: '', music: '' },
      summary_short: '',
      summary_medium: '',
      summary_long_spoilers: '',
      suspense_breaker: '',
      where_to_watch: [],
      extra_images: [],
      ai_notes: ''
    };

    const { next, receipt } = saveMovieToFolderWithReceipt(base, base[0].id, movie, 'Arrival');

    expect(receipt).not.toBeNull();
    expect(receipt?.mode).toBe('insert');
    expect(next[0].items).toHaveLength(1);

    const rolledBack = rollbackWatchlistSave(next, receipt!);
    expect(rolledBack[0].items).toHaveLength(0);
  });

  it('returns a replace receipt and restores the previous item on rollback', () => {
    const base = [{
      id: 'folder-1',
      name: 'Sci-Fi',
      color: '#7c3aed',
      icon: 'film',
      items: [{
        id: 'item-1',
        saved_title: 'Blade Runner 2049',
        movie: {
          tmdb_id: '99',
          title: 'Blade Runner 2049',
          year: '2017',
          type: 'movie' as const,
          media_type: 'movie',
          genres: [],
          poster_url: '/old.jpg',
          backdrop_url: '',
          trailer_url: '',
          ratings: [],
          cast: [],
          crew: { director: '', writer: '', music: '' },
          summary_short: '',
          summary_medium: '',
          summary_long_spoilers: '',
          suspense_breaker: '',
          where_to_watch: [],
          extra_images: [],
          ai_notes: ''
        },
        added_at: '2026-04-10T00:00:00.000Z'
      }]
    }];

    const updatedMovie = {
      tmdb_id: '99',
      title: 'Blade Runner 2049',
      year: '2017',
      type: 'movie' as const,
      media_type: 'movie',
      genres: [],
      poster_url: '/new.jpg',
      backdrop_url: '',
      trailer_url: '',
      ratings: [],
      cast: [],
      crew: { director: '', writer: '', music: '' },
      summary_short: '',
      summary_medium: '',
      summary_long_spoilers: '',
      suspense_breaker: '',
      where_to_watch: [],
      extra_images: [],
      ai_notes: ''
    };

    const { next, receipt } = saveMovieToFolderWithReceipt(base as any, 'folder-1', updatedMovie, 'Blade Runner 2049');

    expect(receipt).not.toBeNull();
    expect(receipt?.mode).toBe('replace');
    expect(next[0].items[0].movie.poster_url).toBe('/new.jpg');

    const rolledBack = rollbackWatchlistSave(next, receipt!);
    expect(rolledBack[0].items[0].movie.poster_url).toBe('/old.jpg');
  });
});
