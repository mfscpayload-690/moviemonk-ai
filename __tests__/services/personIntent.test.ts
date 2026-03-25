import { parsePersonIntent, resolveRoleMatch } from '../../services/personIntent';

describe('personIntent', () => {
  it('parses director intent and year from mixed query', () => {
    const parsed = parsePersonIntent('best director Christopher Nolan 2010 movies');

    expect(parsed.requested_role).toBe('director');
    expect(parsed.year).toBe('2010');
    expect(parsed.is_person_focused).toBe(true);
    expect(parsed.tokens).toEqual(expect.arrayContaining(['christopher', 'nolan']));
  });

  it('parses actress intent and keeps person-focused signal', () => {
    const parsed = parsePersonIntent('actress emma stone');

    expect(parsed.requested_role).toBe('actress');
    expect(parsed.is_person_focused).toBe(true);
    expect(parsed.tokens).toEqual(expect.arrayContaining(['emma', 'stone']));
  });

  it('keeps role as any when no role cues are present', () => {
    const parsed = parsePersonIntent('Interstellar cast');

    expect(parsed.requested_role).toBe('any');
    expect(parsed.tokens).toEqual(expect.arrayContaining(['interstellar', 'cast']));
  });

  it('classifies role match against known-for department', () => {
    expect(resolveRoleMatch('director', 'Directing')).toBe('match');
    expect(resolveRoleMatch('actor', 'Acting')).toBe('match');
    expect(resolveRoleMatch('director', 'Acting')).toBe('mismatch');
    expect(resolveRoleMatch('any', 'Acting')).toBe('neutral');
  });
});
