jest.mock('../../services/tmdbService', () => ({
  fetchTrending: jest.fn(),
  fetchPopular: jest.fn(),
  fetchTopRated: jest.fn(),
  fetchOnTheAir: jest.fn(),
  fetchDiscoverMovie: jest.fn(),
  fetchDiscoverTv: jest.fn(),
  fetchUpcoming: jest.fn(),
  fetchNowPlaying: jest.fn(),
  fetchByGenre: jest.fn(),
  fetchGenreList: jest.fn()
}));

import {
  buildBalancedMixRow,
  dedupeSectionsByTitle,
  getCuratedMovieGenres,
  loadDiscoverySnapshot,
  pickHeroItems
} from '../../hooks/useDiscovery';
import {
  fetchByGenre,
  fetchDiscoverMovie,
  fetchDiscoverTv,
  fetchGenreList,
  fetchNowPlaying,
  fetchOnTheAir,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../../services/tmdbService';

describe('useDiscovery helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('picks curated genres in the requested order', () => {
    const sorted = getCuratedMovieGenres([
      { id: 99, name: 'Documentary' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 878, name: 'Science Fiction' }
    ]);

    expect(sorted).toEqual([
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
      { id: 99, name: 'Documentary' }
    ]);
  });

  it('filters hero candidates to backdrop-ready items and limits count', () => {
    const heroes = pickHeroItems([
      { id: 1, tmdb_id: '1', media_type: 'movie', title: 'A', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7.2, genre_ids: [] },
      { id: 2, tmdb_id: '2', media_type: 'movie', title: 'B', year: '2021', overview: '', poster_url: '', backdrop_url: '/b.jpg', rating: 7.2, genre_ids: [] },
      { id: 3, tmdb_id: '3', media_type: 'movie', title: 'C', year: '2021', overview: '', poster_url: '', backdrop_url: '/c.jpg', rating: 7.2, genre_ids: [] }
    ], 1);

    expect(heroes).toHaveLength(1);
    expect(heroes[0].id).toBe(2);
  });

  it('builds deterministic mix rows with quota fallback when a pool is sparse', () => {
    const mixed = buildBalancedMixRow(
      10,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global A', year: '2024', overview: '', poster_url: '', backdrop_url: '/a.jpg', rating: 7.1, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global B', year: '2024', overview: '', poster_url: '', backdrop_url: '/b.jpg', rating: 7.2, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global C', year: '2024', overview: '', poster_url: '', backdrop_url: '/c.jpg', rating: 7.3, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Global D', year: '2024', overview: '', poster_url: '', backdrop_url: '/d.jpg', rating: 7.4, genre_ids: [] },
          { id: 5, tmdb_id: '5', media_type: 'movie', title: 'Global E', year: '2024', overview: '', poster_url: '', backdrop_url: '/e.jpg', rating: 7.5, genre_ids: [] }
        ],
        bollywood: [
          { id: 21, tmdb_id: '21', media_type: 'movie', title: 'Bolly A', year: '2023', overview: '', poster_url: '', backdrop_url: '/x.jpg', rating: 7.6, genre_ids: [] }
        ],
        asian: [
          { id: 31, tmdb_id: '31', media_type: 'movie', title: 'Asian A', year: '2022', overview: '', poster_url: '', backdrop_url: '/y.jpg', rating: 7.7, genre_ids: [] }
        ]
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    expect(mixed.map((item) => item.title)).toEqual([
      'Global A',
      'Global B',
      'Global C',
      'Global D',
      'Global E',
      'Bolly A',
      'Asian A'
    ]);
  });

  it('falls back to global pool when regional pools are empty', () => {
    const mixed = buildBalancedMixRow(
      5,
      {
        global: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Global 1', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Global 2', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Global 3', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Global 4', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 5, tmdb_id: '5', media_type: 'movie', title: 'Global 5', year: '2024', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ],
        bollywood: [],
        asian: []
      },
      [
        { pool: 'global', ratio: 0.7 },
        { pool: 'bollywood', ratio: 0.15 },
        { pool: 'asian', ratio: 0.15 }
      ]
    );

    expect(mixed).toHaveLength(5);
    expect(mixed.map((item) => item.title)).toEqual(['Global 1', 'Global 2', 'Global 3', 'Global 4', 'Global 5']);
  });

  it('de-duplicates repeated titles across section priority order', () => {
    const sections = dedupeSectionsByTitle([
      {
        key: 'first',
        title: 'First',
        items: [
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Repeat', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Unique First', year: '2021', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      },
      {
        key: 'second',
        title: 'Second',
        items: [
          { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Repeat', year: '2022', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] },
          { id: 4, tmdb_id: '4', media_type: 'movie', title: 'Unique Second', year: '2022', overview: '', poster_url: '', backdrop_url: '', rating: 7, genre_ids: [] }
        ]
      }
    ]);

    expect(sections[0].items.map((item) => item.title)).toEqual(['Repeat', 'Unique First']);
    expect(sections[1].items.map((item) => item.title)).toEqual(['Unique Second']);
  });

  it('loads discovery snapshot and fetches selected genre row from first curated genre', async () => {
    (fetchTrending as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'all') {
        return Promise.resolve([
          { id: 1, tmdb_id: '1', media_type: 'movie', title: 'Hero A', year: '2024', overview: '', poster_url: '', backdrop_url: '/hero-a.jpg', rating: 8.1, genre_ids: [28] },
          { id: 2, tmdb_id: '2', media_type: 'movie', title: 'Hero B', year: '2025', overview: '', poster_url: '', backdrop_url: '', rating: 8.0, genre_ids: [35] }
        ]);
      }
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 11, tmdb_id: '11', media_type: 'tv', title: 'Trending Series', year: '2022', overview: '', poster_url: '', backdrop_url: '/ts.jpg', rating: 8.4, genre_ids: [18] }
        ]);
      }
      return Promise.resolve([
        { id: 3, tmdb_id: '3', media_type: 'movie', title: 'Trending Movie', year: '2020', overview: '', poster_url: '', backdrop_url: '/x.jpg', rating: 7.1, genre_ids: [28] }
      ]);
    });
    (fetchUpcoming as jest.Mock).mockResolvedValue([
      { id: 41, tmdb_id: '41', media_type: 'movie', title: 'Upcoming Movie', year: '2026', overview: '', poster_url: '', backdrop_url: '/up.jpg', rating: 7.6, genre_ids: [28] }
    ]);
    (fetchNowPlaying as jest.Mock).mockResolvedValue([
      { id: 42, tmdb_id: '42', media_type: 'movie', title: 'Now Playing Hollywood', year: '2025', overview: '', poster_url: '', backdrop_url: '/np.jpg', rating: 7.4, genre_ids: [28] }
    ]);
    (fetchPopular as jest.Mock).mockResolvedValue([
      { id: 10, tmdb_id: '10', media_type: 'tv', title: 'Popular Show', year: '2023', overview: '', poster_url: '', backdrop_url: '/ps.jpg', rating: 8.9, genre_ids: [18] }
    ]);
    (fetchOnTheAir as jest.Mock).mockResolvedValue([
      { id: 12, tmdb_id: '12', media_type: 'tv', title: 'On Air Drama', year: '2024', overview: '', poster_url: '', backdrop_url: '/oa.jpg', rating: 8.6, genre_ids: [18] }
    ]);
    (fetchTopRated as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 13, tmdb_id: '13', media_type: 'tv', title: 'Top Rated Series', year: '2021', overview: '', poster_url: '', backdrop_url: '/tv-top.jpg', rating: 9.1, genre_ids: [18] }
        ]);
      }
      return Promise.resolve([
        { id: 20, tmdb_id: '20', media_type: 'movie', title: 'Top Rated', year: '2019', overview: '', poster_url: '', backdrop_url: '/tr.jpg', rating: 9.2, genre_ids: [18] }
      ]);
    });
    (fetchDiscoverMovie as jest.Mock).mockImplementation((options: { withOriginalLanguage?: string }) => {
      const byLanguage: Record<string, any[]> = {
        hi: [{ id: 51, tmdb_id: '51', media_type: 'movie', title: 'Bollywood Pick', year: '2024', overview: '', poster_url: '', backdrop_url: '/hi.jpg', rating: 8.0, genre_ids: [18] }],
        ja: [{ id: 52, tmdb_id: '52', media_type: 'movie', title: 'Asian Pick', year: '2023', overview: '', poster_url: '', backdrop_url: '/ja.jpg', rating: 7.9, genre_ids: [18] }],
        ko: [{ id: 53, tmdb_id: '53', media_type: 'movie', title: 'Korean Pick', year: '2025', overview: '', poster_url: '', backdrop_url: '/ko.jpg', rating: 7.8, genre_ids: [18] }]
      };
      return Promise.resolve(byLanguage[options?.withOriginalLanguage || ''] || []);
    });
    (fetchGenreList as jest.Mock).mockImplementation((mediaType: string) => {
      if (mediaType === 'tv') {
        return Promise.resolve([
          { id: 18, name: 'Drama' },
          { id: 35, name: 'Comedy' }
        ]);
      }
      return Promise.resolve([
        { id: 35, name: 'Comedy' },
        { id: 28, name: 'Action' }
      ]);
    });
    (fetchDiscoverTv as jest.Mock).mockImplementation((options: { withOriginalLanguage?: string }) => {
      const byLanguage: Record<string, any[]> = {
        ko: [{ id: 31, tmdb_id: '31', media_type: 'tv', title: 'K-Drama Hit', year: '2024', overview: '', poster_url: '', backdrop_url: '/ko.jpg', rating: 8.8, genre_ids: [18] }],
        ja: [{ id: 32, tmdb_id: '32', media_type: 'tv', title: 'Japanese Drama', year: '2023', overview: '', poster_url: '', backdrop_url: '/ja.jpg', rating: 8.3, genre_ids: [18] }],
        zh: [{ id: 33, tmdb_id: '33', media_type: 'tv', title: 'Chinese Series', year: '2022', overview: '', poster_url: '', backdrop_url: '/zh.jpg', rating: 8.1, genre_ids: [18] }],
        th: [{ id: 34, tmdb_id: '34', media_type: 'tv', title: 'Thai Drama', year: '2023', overview: '', poster_url: '', backdrop_url: '/th.jpg', rating: 8.0, genre_ids: [18] }]
      };
      return Promise.resolve(byLanguage[options?.withOriginalLanguage || ''] || []);
    });
    (fetchByGenre as jest.Mock).mockResolvedValue([
      { id: 99, tmdb_id: '99', media_type: 'movie', title: 'Genre Match', year: '2018', overview: '', poster_url: '', backdrop_url: '/gm.jpg', rating: 7.3, genre_ids: [28] }
    ]);

    const snapshot = await loadDiscoverySnapshot();

    expect(snapshot.heroItems.map((x) => x.id)).toEqual([1]);
    expect(snapshot.sections).toHaveLength(6);
    expect(snapshot.sections[0].title).toBe('Trending Movies');
    expect(snapshot.sections[1].title).toBe('Upcoming');
    expect(snapshot.sections[2].title).toBe('Now Playing');
    expect(snapshot.sections[3].title).toBe('Top Rated Movies & Series');
    expect(snapshot.sections[4].title).toBe('Global Web Series and TV Shows');
    expect(snapshot.sections[5].title).toBe('K-Drama and Asian Series');
    expect(snapshot.sections[0].items.map((x) => x.id)).toEqual([3, 51, 52, 53]);
    expect(snapshot.sections[2].items.map((x) => x.id)).toEqual([42]);
    expect(snapshot.sections[3].items.map((x) => x.id)).toEqual([20, 13]);
    expect(snapshot.sections[4].items.map((x) => x.id)).toEqual([12, 10, 11]);
    expect(snapshot.sections[5].items.map((x) => x.id)).toEqual([31, 32, 33, 34]);

    const titlesAcrossSections = snapshot.sections.flatMap((section) => section.items.map((item) => item.title.toLowerCase()));
    expect(new Set(titlesAcrossSections).size).toBe(titlesAcrossSections.length);
    expect(snapshot.movieGenres).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' }
    ]);
    expect(snapshot.selectedGenre).toEqual({ id: 28, name: 'Action' });
    expect(fetchByGenre).toHaveBeenCalledWith(28, 'movie', { signal: undefined });
    expect(snapshot.selectedGenreItems[0].title).toBe('Genre Match');
  });
});
