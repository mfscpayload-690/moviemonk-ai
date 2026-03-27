import { parseAppRoute } from '../../lib/routeState';

describe('parseAppRoute', () => {
  it('parses home route', () => {
    expect(parseAppRoute('/', '')).toEqual({ kind: 'home' });
  });

  it('parses search route query', () => {
    expect(parseAppRoute('/search', '?q=inception')).toEqual({ kind: 'search', query: 'inception' });
  });

  it('parses movie and person ids', () => {
    expect(parseAppRoute('/movie/550', '')).toEqual({ kind: 'movie', id: 550 });
    expect(parseAppRoute('/person/31', '')).toEqual({ kind: 'person', id: 31 });
  });

  it('returns unknown for unsupported paths', () => {
    expect(parseAppRoute('/foo/bar', '')).toEqual({ kind: 'unknown' });
  });
});
