jest.mock('../../components/icons', () => ({
  BirthdayIcon: () => null,
  LocationIcon: () => null,
  SparklesIcon: () => null
}));

jest.mock('../../lib/perfDebug', () => ({
  useRenderCounter: () => undefined
}));

jest.mock('@vercel/analytics/react', () => ({
  track: () => undefined
}));

import {
  derivePersonCreditBuckets,
  selectVisibleCredits,
  toOpenTitlePayload,
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
  });

  it('maps person credit to title-open callback payload', () => {
    expect(toOpenTitlePayload({ id: 5, media_type: 'movie' })).toEqual({ id: 5, mediaType: 'movie' });
    expect(toOpenTitlePayload({ id: 6, media_type: 'tv' })).toEqual({ id: 6, mediaType: 'tv' });
  });
});
