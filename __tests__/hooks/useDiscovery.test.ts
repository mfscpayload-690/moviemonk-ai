jest.mock('../../services/tmdbService', () => ({
  fetchTrending: jest.fn(),
  fetchPopular: jest.fn(),
  fetchTopRated: jest.fn(),
  fetchOnTheAir: jest.fn(),
  fetchDiscoverTv: jest.fn(),
  fetchUpcoming: jest.fn(),
  fetchByGenre: jest.fn(),
  fetchGenreList: jest.fn()
}));

import {
  getCuratedMovieGenres,
  loadDiscoverySnapshot,
  pickHeroItems
} from '../../hooks/useDiscovery';
import {
  fetchByGenre,
  fetchDiscoverTv,
  fetchGenreList,
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
    (fetchUpcoming as jest.Mock).mockResolvedValue([]);
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
    expect(snapshot.sections).toHaveLength(5);
    expect(snapshot.sections[0].title).toBe('Trending Movies');
    expect(snapshot.sections[1].title).toBe('K-Drama and Asian Series');
    expect(snapshot.sections[1].items.map((x) => x.id)).toEqual([31, 32, 33, 34]);
    expect(snapshot.sections[2].title).toBe('Global Web Series and TV Shows');
    expect(snapshot.sections[2].items.map((x) => x.id)).toEqual([12, 13, 10, 11]);
    expect(snapshot.movieGenres).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' }
    ]);
    expect(snapshot.selectedGenre).toEqual({ id: 28, name: 'Action' });
    expect(fetchByGenre).toHaveBeenCalledWith(28, 'movie', { signal: undefined });
    expect(snapshot.selectedGenreItems[0].title).toBe('Genre Match');
  });
});
