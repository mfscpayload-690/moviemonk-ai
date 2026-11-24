import {
  fetchTitleSoundtrack,
  normalizeText,
  getSoundtrackRegion,
  clearSoundtrackCache,
} from '../../services/soundtrackService';

describe('soundtrackService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearSoundtrackCache();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('normalizeText', () => {
    it('strips punctuation, lowercases, and collapses whitespace', () => {
      expect(normalizeText('Interstellar: Original Soundtrack!')).toBe(
        'interstellar original soundtrack'
      );
      expect(normalizeText('Spider-Man:   Across the Spider-Verse')).toBe(
        'spider man across the spider verse'
      );
      expect(normalizeText('  KGF: Chapter 2  ')).toBe('kgf chapter 2');
    });

    it('handles empty or undefined values safely', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText(undefined)).toBe('');
    });
  });

  describe('getSoundtrackRegion', () => {
    it('returns valid 2-letter uppercase country code when provided', () => {
      expect(getSoundtrackRegion('in')).toBe('IN');
      expect(getSoundtrackRegion('GB')).toBe('GB');
    });

    it('defaults to US or detects properly when invalid/empty', () => {
      expect(getSoundtrackRegion('invalid')).toBe('US');
      expect(getSoundtrackRegion('')).toBe('US');
    });
  });

  describe('fetchTitleSoundtrack', () => {
    it('returns empty tracks and fallback links when title is missing', async () => {
      const result = await fetchTitleSoundtrack({ title: '' });
      expect(result.tracks).toEqual([]);
      expect(result.fallbackLinks.spotifyUrl).toContain('spotify.com');
      expect(result.fallbackLinks.youtubeUrl).toContain('youtube.com');
    });

    it('filters out spam albums (karaoke, tribute, etc.)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              trackId: 101,
              trackName: 'Cornfield Chase',
              artistName: 'Hans Zimmer',
              collectionName: 'Interstellar Tribute & Karaoke Edition',
              releaseDate: '2014-11-07',
            },
            {
              trackId: 102,
              trackName: 'Cornfield Chase',
              artistName: 'Hans Zimmer',
              collectionName: 'Interstellar (Original Motion Picture Soundtrack)',
              releaseDate: '2014-11-17',
              trackTimeMillis: 126000,
              artworkUrl100: 'https://example.com/cover/100x100bb.jpg',
              previewUrl: 'https://example.com/preview.m4a',
            },
          ],
        }),
      } as any);

      const result = await fetchTitleSoundtrack({
        title: 'Interstellar',
        releaseYear: '2014',
        composer: 'Hans Zimmer',
      });

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].id).toBe(102);
      expect(result.tracks[0].album).toBe('Interstellar (Original Motion Picture Soundtrack)');
      expect(result.tracks[0].coverArt).toBe('https://example.com/cover/300x300bb.jpg');
      expect(result.tracks[0].duration).toBe('2:06');
    });

    it('filters out tracks with incompatible release years', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              trackId: 201,
              trackName: 'Old Song',
              artistName: 'Some Artist',
              collectionName: 'Avatar Soundtrack',
              releaseDate: '1995-01-01', // Too far before 2009
            },
            {
              trackId: 202,
              trackName: 'I See You',
              artistName: 'James Horner',
              collectionName: 'Avatar (Music from the Motion Picture)',
              releaseDate: '2009-12-15',
              trackTimeMillis: 260000,
            },
          ],
        }),
      } as any);

      const result = await fetchTitleSoundtrack({
        title: 'Avatar',
        releaseYear: '2009',
        composer: 'James Horner',
      });

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].id).toBe(202);
    });

    it('deduplicates identical track titles across albums', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              trackId: 301,
              trackName: 'Stay',
              artistName: 'Hans Zimmer',
              collectionName: 'Interstellar (Standard Edition)',
              releaseDate: '2014-11-17',
              trackTimeMillis: 300000,
            },
            {
              trackId: 302,
              trackName: 'Stay',
              artistName: 'Hans Zimmer',
              collectionName: 'Interstellar (Deluxe Edition)',
              releaseDate: '2014-11-17',
              trackTimeMillis: 300000,
            },
          ],
        }),
      } as any);

      const result = await fetchTitleSoundtrack({
        title: 'Interstellar',
        releaseYear: '2014',
      });

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].id).toBe(301);
    });

    it('caches subsequent calls for the same title/year', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              trackId: 401,
              trackName: 'Time',
              artistName: 'Hans Zimmer',
              collectionName: 'Inception Soundtrack',
              releaseDate: '2010-07-13',
            },
            {
              trackId: 402,
              trackName: 'Dream is Collapsing',
              artistName: 'Hans Zimmer',
              collectionName: 'Inception Soundtrack',
              releaseDate: '2010-07-13',
            },
          ],
        }),
      });
      global.fetch = mockFetch as any;

      await fetchTitleSoundtrack({ title: 'Inception', releaseYear: 2010 });
      await fetchTitleSoundtrack({ title: 'Inception', releaseYear: 2010 });

      // Primary fetch made 1 call (yielded >= 2 candidates), second call served from cache
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles network failures gracefully without crashing', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchTitleSoundtrack({
        title: 'The Dark Knight',
        releaseYear: 2008,
      });

      expect(result.tracks).toEqual([]);
      expect(result.fallbackLinks.spotifyUrl).toContain('The%20Dark%20Knight');
    });
  });
});
