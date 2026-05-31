jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => null,
  LocationIcon: () => null,
  SparklesIcon: () => null,
  WatchedIcon: () => null,
  TagIcon: () => null
}));

jest.mock('../../lib/perfDebug', () => ({
  useRenderCounter: () => undefined
}));

jest.mock('@vercel/analytics/react', () => ({
  track: () => undefined
}));

import {
  dedupePersonCredits,
  derivePersonCreditBuckets,
  filterPersonCredits,
  getAvailableMediaFilters,
  isCreditSavedToWatchlist,
  selectVisibleCredits,
  sortPersonCredits,
  toOpenTitlePayload,
  toQuickSaveTitle,
  truncateBiography,
  PersonPayload
} from '../../components/PersonDisplay';

describe('PersonDisplay helpers', () => {
  const payload: PersonPayload = {
    person: {
      id: 9,
      name: 'Sample Person'
    },
    filmography: [],
    credits_all: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Directed A',
        year: 2023,
        role: 'Director',
        role_bucket: 'directing',
        popularity: 50
      },
      {
        id: 2,
        media_type: 'tv',
        title: 'Acted B',
        year: 2024,
        role: 'cast',
        role_bucket: 'acting',
        popularity: 80
      }
    ],
    credits_acting: [
      {
        id: 2,
        media_type: 'tv',
        title: 'Acted B',
        year: 2024,
        role: 'cast',
        role_bucket: 'acting',
        popularity: 80
      }
    ],
    credits_directing: [
      {
        id: 1,
        media_type: 'movie',
        title: 'Directed A',
        year: 2023,
        role: 'Director',
        role_bucket: 'directing',
        popularity: 50
      }
    ]
  };

  it('derives buckets and role distribution', () => {
    const buckets = derivePersonCreditBuckets(payload);

    expect(buckets.allCredits).toHaveLength(2);
    expect(buckets.actingCredits).toHaveLength(1);
    expect(buckets.directingCredits).toHaveLength(1);
    expect(buckets.roleDistribution).toEqual({
      acting: 1,
      directing: 1,
      other: 0
    });
  });

  it('selects visible credits by active tab', () => {
    const buckets = derivePersonCreditBuckets(payload);

    expect(selectVisibleCredits('all', buckets)).toHaveLength(2);
    expect(selectVisibleCredits('acting', buckets).map((credit) => credit.id)).toEqual([2]);
    expect(selectVisibleCredits('directing', buckets).map((credit) => credit.id)).toEqual([1]);
    expect(selectVisibleCredits('other', buckets)).toHaveLength(0);
  });

  it('maps person credit to title-open callback payload', () => {
    expect(toOpenTitlePayload({ id: 5, media_type: 'movie' })).toEqual({ id: 5, mediaType: 'movie' });
    expect(toOpenTitlePayload({ id: 6, media_type: 'tv' })).toEqual({ id: 6, mediaType: 'tv' });
  });

  it('maps person credit to quick-save payload and saved state', () => {
    const credit = { id: 5, media_type: 'movie' as const, title: 'Saved Film', year: 2025, poster_url: '/saved.jpg' };

    expect(toQuickSaveTitle(credit)).toEqual({
      id: 5,
      media_type: 'movie',
      title: 'Saved Film',
      year: '2025',
      poster_url: '/saved.jpg'
    });
    expect(isCreditSavedToWatchlist(credit, [
      {
        id: 'folder-1',
        name: 'Watchlist',
        items: [
          {
            id: 'item-1',
            saved_title: 'Saved Film',
            added_at: '2026-01-01T00:00:00.000Z',
            movie: {
              tmdb_id: '5',
              title: 'Saved Film',
              year: '2025',
              type: 'movie',
              media_type: 'movie',
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
    ])).toBe(true);
  });

  it('dedupes repeated title credits and preserves secondary roles', () => {
    const credits = dedupePersonCredits([
      {
        id: 10,
        media_type: 'movie',
        title: 'Same Film',
        year: 2023,
        role: 'cast',
        role_bucket: 'acting',
        character: 'Lead',
        popularity: 30
      },
      {
        id: 10,
        media_type: 'movie',
        title: 'Same Film',
        year: 2023,
        role: 'Producer',
        role_bucket: 'other',
        popularity: 40
      }
    ]);

    expect(credits).toHaveLength(1);
    expect(credits[0].displayRoles).toEqual(['cast', 'Producer']);
    expect(credits[0].displayCharacters).toEqual(['Lead']);
    expect(credits[0].popularity).toBe(40);
  });

  it('filters and sorts credits for explorer controls', () => {
    const credits = dedupePersonCredits([
      { id: 1, media_type: 'movie', title: 'Beta', year: 2022, role: 'cast', role_bucket: 'acting', popularity: 10 },
      { id: 2, media_type: 'tv', title: 'Alpha', year: 2024, role: 'cast', role_bucket: 'acting', popularity: 5 },
      { id: 3, media_type: 'movie', title: 'Gamma', year: 2020, role: 'Director', role_bucket: 'directing', popularity: 50 }
    ]);

    expect(getAvailableMediaFilters(credits)).toEqual(['all', 'movie', 'tv']);
    expect(filterPersonCredits(credits, 'movie').map((credit) => credit.title)).toEqual(['Beta', 'Gamma']);
    expect(sortPersonCredits(credits, 'newest').map((credit) => credit.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(sortPersonCredits(credits, 'title').map((credit) => credit.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(sortPersonCredits(credits, 'popular').map((credit) => credit.title)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('truncates long biographies for collapsed display', () => {
    const biography = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');
    const result = truncateBiography(biography, 120);

    expect(result.isTruncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(123);
    expect(result.text.endsWith('...')).toBe(true);
  });
});
