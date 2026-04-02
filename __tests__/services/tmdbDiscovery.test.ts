import {
  fetchByGenre,
  fetchGenreList,
  fetchNowPlaying,
  fetchOnTheAir,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchUpcoming
} from '../../services/tmdbService';

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

function okJson(payload: any) {
  const body = JSON.stringify(payload);
  return {
    ok: true,
    status: 200,
    text: async () => body,
    json: async () => payload
  };
}

function getCalledUrl(index = 0): URL {
  const raw = mockFetch.mock.calls[index]?.[0];
  return new URL(String(raw));
}

describe('tmdb discovery service helpers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.TMDB_PROXY = 'http://localhost:3000/api/tmdb';
  });

  it('normalizes trending all titles and filters unsupported media types', async () => {
    mockFetch.mockResolvedValueOnce(okJson({
      results: [
        {
          id: 10,
          media_type: 'movie',
          title: 'Dune',
          release_date: '2021-10-22',
          overview: 'Spice and prophecy.',
          poster_path: '/dune.jpg',
          backdrop_path: '/dune-bg.jpg',
          vote_average: 8.3,
          genre_ids: [878, 12]
        },
        {
          id: 11,
          media_type: 'tv',
          name: 'The Last of Us',
          first_air_date: '2023-01-15',
          overview: 'Survival in a fungal apocalypse.',
          poster_path: '/tlou.jpg',
          backdrop_path: '/tlou-bg.jpg',
          vote_average: 8.8,
          genre_ids: [18]
        },
        {
          id: 12,
          media_type: 'person',
          name: 'Pedro Pascal'
        }
      ]
    }));

    const items = await fetchTrending('all', 'week');

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 10,
      tmdb_id: '10',
      media_type: 'movie',
      title: 'Dune',
      year: '2021',
      rating: 8.3,
      genre_ids: [878, 12]
    });
    expect(items[1]).toMatchObject({
      id: 11,
      media_type: 'tv',
      title: 'The Last of Us',
      year: '2023'
    });

    const url = getCalledUrl();
    expect(url.searchParams.get('endpoint')).toBe('trending/all/week');
  });

  it('calls popular, top rated, upcoming, now playing, and on the air endpoints', async () => {
    mockFetch
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }))
      .mockResolvedValueOnce(okJson({ results: [] }));

    await fetchPopular('tv');
    await fetchTopRated('movie');
    await fetchUpcoming();
    await fetchNowPlaying();
    await fetchOnTheAir();

    expect(getCalledUrl(0).searchParams.get('endpoint')).toBe('tv/popular');
    expect(getCalledUrl(1).searchParams.get('endpoint')).toBe('movie/top_rated');
    expect(getCalledUrl(2).searchParams.get('endpoint')).toBe('movie/upcoming');
    expect(getCalledUrl(3).searchParams.get('endpoint')).toBe('movie/now_playing');
    expect(getCalledUrl(4).searchParams.get('endpoint')).toBe('tv/on_the_air');
  });

  it('passes with_genres for discover requests and normalizes genres list', async () => {
    mockFetch
      .mockResolvedValueOnce(okJson({
        results: [
          {
            id: 99,
            media_type: 'movie',
            title: 'Mad Max: Fury Road',
            release_date: '2015-05-15',
            poster_path: '/mm.jpg',
            backdrop_path: '/mm-bg.jpg',
            vote_average: 8.1,
            overview: '',
            genre_ids: [28, 12]
          }
        ]
      }))
      .mockResolvedValueOnce(okJson({
        genres: [
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: null, name: 'Bad' },
          { id: 99, name: '' }
        ]
      }));

    const discovered = await fetchByGenre(28, 'movie');
    const genreList = await fetchGenreList('movie');

    expect(discovered[0]).toMatchObject({ id: 99, title: 'Mad Max: Fury Road' });
    expect(genreList).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' }
    ]);

    expect(getCalledUrl(0).searchParams.get('endpoint')).toBe('discover/movie');
    expect(getCalledUrl(0).searchParams.get('with_genres')).toBe('28');
    expect(getCalledUrl(1).searchParams.get('endpoint')).toBe('genre/movie/list');
  });
});
