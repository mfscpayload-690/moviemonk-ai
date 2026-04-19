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
    status: 200,
    text: async () => JSON.stringify(payload),
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
      const page = url.searchParams.get('page');

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
        if (withCast) {
          return Promise.resolve(okJson({
            results: [makeMovieResult(401, 'Cast Match Soon', daysFromNow(8), [28])]
          }));
        }

        if (withOriginalLanguage === 'ko') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(610, 'Seoul Drift', daysFromNow(9), [28], 'ko')]
          }));
        }
        if (withOriginalLanguage === 'ja') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(611, 'Tokyo Pulse', daysFromNow(11), [28], 'ja')]
          }));
        }
        if (withOriginalLanguage === 'zh') {
          return Promise.resolve(okJson({
            results: [makeMovieResult(612, 'Dragon City', daysFromNow(12), [28], 'zh')]
          }));
        }
        if (withOriginalLanguage === 'hi') {
          if (page === '2') {
            return Promise.resolve(okJson({
              results: [makeMovieResult(711, 'Delhi Nights', daysFromNow(12), [53], 'hi')]
            }));
          }
          return Promise.resolve(okJson({
            results: [makeMovieResult(710, 'Mumbai Heat', daysFromNow(10), [53], 'hi')]
          }));
        }
        if (withOriginalLanguage === 'en') {
          return Promise.resolve(okJson({
            results: [
              makeMovieResult(301, 'Hollywood One', daysFromNow(4), [28], 'en'),
              makeMovieResult(302, 'Hollywood Two', daysFromNow(5), [28], 'en'),
              makeMovieResult(303, 'Hollywood Three', daysFromNow(6), [28], 'en'),
              makeMovieResult(304, 'Hollywood Four', daysFromNow(7), [28], 'en'),
              makeMovieResult(305, 'Hollywood Five', daysFromNow(13), [28], 'en'),
              makeMovieResult(306, 'WWE Countdown Slam', daysFromNow(14), [28], 'en')
            ]
          }));
        }

        return Promise.resolve(okJson({
          results: [
            makeMovieResult(901, 'Genre Match One', daysFromNow(15), [28]),
            makeMovieResult(902, 'Documentary Nights', daysFromNow(16), [99]),
            makeMovieResult(903, 'Tamil Storm', daysFromNow(17), [28], 'ta')
          ]
        }));
      }

      if (endpoint === 'discover/tv') {
        if (withOriginalLanguage === 'en') {
          return Promise.resolve(okJson({
            results: [
              makeTvResult(801, 'Hollywood Series One', daysFromNow(3)),
              makeTvResult(802, 'Hollywood Series Two', daysFromNow(8))
            ]
          }));
        }
        if (withOriginalLanguage === 'ko') {
          return Promise.resolve(okJson({
            results: [makeTvResult(811, 'K-Drama Pulse', daysFromNow(10), [18], 'ko')]
          }));
        }
        if (withOriginalLanguage === 'ja') {
          return Promise.resolve(okJson({
            results: [makeTvResult(812, 'J-Drama Notes', daysFromNow(11), [18], 'ja')]
          }));
        }
        if (withOriginalLanguage === 'zh') {
          return Promise.resolve(okJson({
            results: [makeTvResult(813, 'C-Drama Vibes', daysFromNow(12), [18], 'zh')]
          }));
        }
        if (withOriginalLanguage === 'hi') {
          return Promise.resolve(okJson({
            results: [makeTvResult(821, 'Hindi Series Spark', daysFromNow(12), [18], 'hi')]
          }));
        }
        return Promise.resolve(okJson({ results: [] }));
      }

      return Promise.resolve({ ok: false, status: 404, text: async () => '{}', json: async () => ({}) });
    });
  });

  it('detects when radar inputs are present', () => {
    expect(hasRadarInputs(watchlists)).toBe(true);
    expect(hasRadarInputs([{ ...watchlists[0], items: [] }])).toBe(false);
  });

  it('loads a single release radar list, filters noisy entries, and reuses cache', async () => {
    const first = await loadReleaseRadarSnapshot(watchlists);
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.items.length).toBeLessThanOrEqual(12);
    expect(first.items.some((item) => item.original_language === 'ko' || item.original_language === 'ja' || item.original_language === 'zh')).toBe(true);
    expect(first.items.some((item) => item.original_language === 'hi')).toBe(true);
    expect(first.items.filter((item) => item.original_language === 'hi').length).toBeGreaterThanOrEqual(1);
    expect(first.items.filter((item) => item.original_language === 'en').length).toBeGreaterThan(0);
    expect(first.items.some((item) => item.media_type === 'tv')).toBe(true);
    expect(first.items.some((item) => /wwe|countdown/i.test(item.title))).toBe(false);
    expect(first.items.some((item) => /documentary/i.test(item.title))).toBe(false);
    expect(first.items.some((item) => ['ta', 'te', 'ml', 'kn'].includes(item.original_language || ''))).toBe(false);

    const fetchCountAfterFirst = mockFetch.mock.calls.length;
    const second = await loadReleaseRadarSnapshot(watchlists);
    expect(second.items.length).toBeGreaterThan(0);
    expect(mockFetch.mock.calls.length).toBe(fetchCountAfterFirst);
  });

  it('returns radar data for guests without watchlists', async () => {
    const guestSnapshot = await loadReleaseRadarSnapshot([]);
    expect(guestSnapshot.items.length).toBeGreaterThan(0);
    expect(guestSnapshot.items.length).toBeLessThanOrEqual(12);
    expect(guestSnapshot.items.some((item) => item.original_language === 'ko' || item.original_language === 'ja' || item.original_language === 'zh')).toBe(true);
    expect(guestSnapshot.items.some((item) => item.original_language === 'hi')).toBe(true);
    expect(guestSnapshot.items.some((item) => ['ta', 'te', 'ml', 'kn'].includes(item.original_language || ''))).toBe(false);
  });
});
