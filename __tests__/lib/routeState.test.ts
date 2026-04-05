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

  it('parses TV route', () => {
    expect(parseAppRoute('/tv/1399', '')).toEqual({ kind: 'tv', id: 1399 });
  });

  it('parses shared typed deep links', () => {
    // Shared movie link
    expect(parseAppRoute('/', '?q=Inception&type=movie&year=2010')).toEqual({ 
      kind: 'search', 
      query: 'Inception' 
    });
    
    // Shared show link
    expect(parseAppRoute('/', '?q=Breaking%20Bad&type=show&year=2008')).toEqual({ 
      kind: 'search', 
      query: 'Breaking Bad' 
    });
    
    // Shared person direct link
    expect(parseAppRoute('/', '?q=Leonardo%20DiCaprio&type=person&id=6193')).toEqual({ 
      kind: 'person', 
      id: 6193 
    });
  });

  it('returns unknown for unsupported paths', () => {
    expect(parseAppRoute('/foo/bar', '')).toEqual({ kind: 'unknown' });
  });
});
