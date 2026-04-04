import { hasRadarInputs, loadReleaseRadarSnapshot } from '../../services/releaseRadarService';
import { WatchlistFolder } from '../../types';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const storage = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  clear: () => {
    storage.clear();
  }
};

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function okJson(payload: any) {
  return {
    ok: true,
    json: async () => payload
  };
}

function makeMovieResult(id: number, title: string, releaseDate: string, genreIds: number[] = [28]) {
  return {
    id,
    title,
    release_date: releaseDate,
    overview: `${title} overview`,
    poster_path: `/poster-${id}.jpg`,
    backdrop_path: `/backdrop-${id}.jpg`,
    vote_average: 7.6,
    popularity: 88 + id,
    genre_ids: genreIds,
    media_type: 'movie'
  };
}

const watchlists: WatchlistFolder[] = [
  {
    id: 'w1',
    name: 'Action Vault',
    color: '#7c3aed',
    icon: 'action',
    items: [
      {
        id: 'i1',
        saved_title: 'Existing Action',
        added_at: new Date().toISOString(),
        movie: {
          tmdb_id: '11',
          title: 'Existing Action',
          year: '2024',
          type: 'movie',
          genres: ['Action', 'Thriller'],
          poster_url: '',
          backdrop_url: '',
          trailer_url: '',
          ratings: [],
          cast: [{ name: 'Keanu Reeves', role: 'Lead', known_for: 'Action' }],
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

describe('releaseRadarService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    storage.clear();

    mockFetch.mockImplementation((input: string) => {
      const url = new URL(String(input), 'http://localhost');
      const endpoint = url.searchParams.get('endpoint');
      const query = url.searchParams.get('query');
      const withCast = url.searchParams.get('with_cast');
      const lte = url.searchParams.get('primary_release_date.lte');

      if (endpoint === 'genre/movie/list') {
        return Promise.resolve(okJson({ genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }] }));
      }

      if (endpoint === 'search/person') {
        if (query === 'Keanu Reeves') {
          return Promise.resolve(okJson({ results: [{ id: 1001, name: 'Keanu Reeves' }] }));
        }
        return Promise.resolve(okJson({ results: [] }));
      }

      if (endpoint === 'discover/movie') {
        const withinDaily = typeof lte === 'string' && lte <= daysFromNow(2);
        if (withCast) {
          return Promise.resolve(okJson({
            results: withinDaily
              ? [makeMovieResult(401, 'Cast Match Daily', daysFromNow(1), [28])]
              : [makeMovieResult(402, 'Cast Match Weekly', daysFromNow(6), [28])]
          }));
        }

        return Promise.resolve(okJson({
          results: withinDaily
            ? [makeMovieResult(301, 'Genre Match Daily', daysFromNow(2), [28])]
            : [makeMovieResult(302, 'Genre Match Weekly', daysFromNow(8), [28])]
        }));
      }

      if (endpoint === 'movie/upcoming') {
        return Promise.resolve(okJson({
          results: [
            makeMovieResult(501, 'Upcoming A', daysFromNow(1), [28]),
            makeMovieResult(502, 'Upcoming B', daysFromNow(7), [53])
          ]
        }));
      }

      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
  });

  it('detects when radar inputs are present', () => {
    expect(hasRadarInputs(watchlists)).toBe(true);
    expect(hasRadarInputs([{ ...watchlists[0], items: [] }])).toBe(false);
  });

  it('loads daily and weekly radar items and reuses daily cache', async () => {
    const first = await loadReleaseRadarSnapshot(watchlists);
    expect(first).not.toBeNull();
    expect(first?.daily.length).toBeGreaterThan(0);
    expect(first?.weekly.length).toBeGreaterThan(0);
    expect(first?.daily.some((item) => item.title.includes('Daily'))).toBe(true);
    expect(first?.weekly.some((item) => item.title.includes('Weekly') || item.title.includes('Upcoming'))).toBe(true);

    const fetchCountAfterFirst = mockFetch.mock.calls.length;
    const second = await loadReleaseRadarSnapshot(watchlists);
    expect(second).not.toBeNull();
    expect(mockFetch.mock.calls.length).toBe(fetchCountAfterFirst);
  });
});

