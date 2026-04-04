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

function makeMovieResult(id: number, title: string, releaseDate: string, genreIds: number[] = [28], originalLanguage: string = 'en') {
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
    original_language: originalLanguage,
    media_type: 'movie'
  };
}

function makeTvResult(id: number, title: string, firstAirDate: string, genreIds: number[] = [18], originalLanguage: string = 'en') {
  return {
    id,
    name: title,
    first_air_date: firstAirDate,
    overview: `${title} overview`,
    poster_path: `/poster-tv-${id}.jpg`,
    backdrop_path: `/backdrop-tv-${id}.jpg`,
    vote_average: 7.9,
    popularity: 70 + id,
    genre_ids: genreIds,
    original_language: originalLanguage,
    media_type: 'tv'
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
      const withOriginalLanguage = url.searchParams.get('with_original_language');
      const lte = url.searchParams.get('primary_release_date.lte');
      const firstAirLte = url.searchParams.get('first_air_date.lte');

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

        if (withOriginalLanguage === 'ko') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(610, 'Seoul Drift', withinDaily ? daysFromNow(1) : daysFromNow(6), [28], 'ko')]
          }));
        }
        if (withOriginalLanguage === 'ja') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(611, 'Tokyo Pulse', withinDaily ? daysFromNow(2) : daysFromNow(7), [28], 'ja')]
          }));
        }
        if (withOriginalLanguage === 'zh') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(612, 'Dragon City', withinDaily ? daysFromNow(2) : daysFromNow(8), [28], 'zh')]
          }));
        }
        if (withOriginalLanguage === 'hi') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(710, 'Mumbai Heat', withinDaily ? daysFromNow(1) : daysFromNow(6), [53], 'hi')]
          }));
        }
        if (withOriginalLanguage === 'en') {
          return Promise.resolve(okJson({
            results: withinDaily
              ? [makeMovieResult(301, 'Hollywood Daily One', daysFromNow(1), [28], 'en'), makeMovieResult(302, 'Hollywood Daily Two', daysFromNow(2), [28], 'en')]
              : [makeMovieResult(303, 'Hollywood Weekly One', daysFromNow(5), [28], 'en'), makeMovieResult(304, 'Hollywood Weekly Two', daysFromNow(8), [28], 'en')]
          }));
        }

        return Promise.resolve(okJson({
          results: withinDaily
            ? [makeMovieResult(301, 'Genre Match Daily', daysFromNow(2), [28])]
            : [makeMovieResult(302, 'Genre Match Weekly', daysFromNow(8), [28])]
        }));
      }

      if (endpoint === 'discover/tv') {
        const withinDaily = typeof firstAirLte === 'string' && firstAirLte <= daysFromNow(2);
        if (withOriginalLanguage === 'en') {
          return Promise.resolve(okJson({
            results: withinDaily
              ? [makeTvResult(801, 'Hollywood Series Daily', daysFromNow(1))]
              : [makeTvResult(802, 'Hollywood Series Weekly', daysFromNow(6))]
          }));
        }
        if (withOriginalLanguage === 'ko') {
          return Promise.resolve(okJson({
            results: [makeTvResult(811, 'K-Drama Pulse', withinDaily ? daysFromNow(1) : daysFromNow(7), [18], 'ko')]
          }));
        }
        if (withOriginalLanguage === 'ja') {
          return Promise.resolve(okJson({
            results: [makeTvResult(812, 'J-Drama Notes', withinDaily ? daysFromNow(2) : daysFromNow(8), [18], 'ja')]
          }));
        }
        if (withOriginalLanguage === 'zh') {
          return Promise.resolve(okJson({
            results: [makeTvResult(813, 'C-Drama Vibes', withinDaily ? daysFromNow(2) : daysFromNow(9), [18], 'zh')]
          }));
        }
        if (withOriginalLanguage === 'hi') {
          return Promise.resolve(okJson({
            results: [makeTvResult(821, 'Hindi Series Spark', withinDaily ? daysFromNow(2) : daysFromNow(9), [18], 'hi')]
          }));
        }
        return Promise.resolve(okJson({ results: [] }));
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
    expect(first.daily.length).toBeGreaterThan(0);
    expect(first.weekly.length).toBeGreaterThan(0);
    expect(first.daily.some((item) => item.original_language === 'ko' || item.original_language === 'ja' || item.original_language === 'zh')).toBe(true);
    expect(first.daily.some((item) => item.original_language === 'hi')).toBe(true);
    expect(first.daily.filter((item) => item.original_language === 'en').length).toBeGreaterThan(0);
    expect(first.weekly.some((item) => item.media_type === 'tv')).toBe(true);

    const fetchCountAfterFirst = mockFetch.mock.calls.length;
    const second = await loadReleaseRadarSnapshot(watchlists);
    expect(second.daily.length).toBeGreaterThan(0);
    expect(mockFetch.mock.calls.length).toBe(fetchCountAfterFirst);
  });

  it('returns radar data for guests without watchlists', async () => {
    const guestSnapshot = await loadReleaseRadarSnapshot([]);
    expect(guestSnapshot.daily.length).toBeGreaterThan(0);
    expect(guestSnapshot.weekly.length).toBeGreaterThan(0);
    expect(guestSnapshot.daily.some((item) => item.original_language === 'ko' || item.original_language === 'ja' || item.original_language === 'zh')).toBe(true);
    expect(guestSnapshot.daily.some((item) => item.original_language === 'hi')).toBe(true);
  });
});
