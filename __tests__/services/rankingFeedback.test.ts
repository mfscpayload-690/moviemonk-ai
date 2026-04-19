import type { SearchResult } from '../../types';
import { applyRankingFeedbackWithStore, type RankingFeedbackStore } from '../../services/rankingFeedback';

function createStore(): RankingFeedbackStore {
  return {
    positiveGenres: { 28: 5 },
    negativeGenres: { 18: 4 },
    positiveMediaType: { movie: 3, tv: 0 },
    negativeMediaType: { movie: 0, tv: 2 },
    helpfulQueries: [],
    unhelpfulQueries: [],
    updatedAt: new Date().toISOString()
  };
}

function result(id: number, media_type: 'movie' | 'tv', confidence: number, genre_ids: number[]): SearchResult {
  return {
    id,
    title: `Title ${id}`,
    type: media_type === 'tv' ? 'show' : 'movie',
    media_type,
    confidence,
    genre_ids,
    popularity: 10
  };
}

describe('rankingFeedback', () => {
  it('boosts items aligned with positive genre and media signals', () => {
    const store = createStore();
    const input = [
      result(1, 'tv', 0.7, [18]),
      result(2, 'movie', 0.62, [28]),
      result(3, 'movie', 0.6, [18])
    ];

    const ranked = applyRankingFeedbackWithStore(input, store);
    expect(ranked[0].id).toBe(2);
    expect(ranked[ranked.length - 1].id).toBe(1);
  });
});
