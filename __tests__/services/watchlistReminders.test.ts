import type { WatchedTitle, WatchlistFolder } from '../../types';
import { deriveWatchlistReminders } from '../../services/watchlistReminders';

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('watchlistReminders', () => {
  it('returns stale unwatched titles sorted by age', () => {
    const folders: WatchlistFolder[] = [
      {
        id: 'folder-1',
        name: 'Weekend',
        items: [
          {
            id: 'item-1',
            saved_title: 'Older',
            added_at: daysAgo(12),
            movie: {
              tmdb_id: '111',
              title: 'Older',
              year: '2023',
              type: 'movie',
              genres: [],
              poster_url: '',
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
            }
          },
          {
            id: 'item-2',
            saved_title: 'Recent',
            added_at: daysAgo(2),
            movie: {
              tmdb_id: '222',
              title: 'Recent',
              year: '2023',
              type: 'show',
              genres: [],
              poster_url: '',
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
            }
          }
        ]
      }
    ];

    const watched: WatchedTitle[] = [];
    const reminders = deriveWatchlistReminders(folders, watched, 3);
    expect(reminders).toHaveLength(1);
    expect(reminders[0].tmdbId).toBe('111');
  });
});
