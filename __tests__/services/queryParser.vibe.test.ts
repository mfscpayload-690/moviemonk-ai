import { parseVibeQuery } from '../../services/queryParser';

describe('parseVibeQuery', () => {
  it('parses vibe constraints with runtime, language, references, and people cues', () => {
    const parsed = parseVibeQuery(
      'mind-bending sci fi movie under 2 hours not horror in korean like Inception and Memento starring Leonardo DiCaprio'
    );

    expect(parsed.query_raw).toBe(
      'mind-bending sci fi movie under 2 hours not horror in korean like Inception and Memento starring Leonardo DiCaprio'
    );
    expect(parsed.hard_constraints.media_type).toBe('movie');
    expect(parsed.hard_constraints.include_genres).toEqual(['science fiction']);
    expect(parsed.hard_constraints.exclude_genres).toEqual(['horror']);
    expect(parsed.hard_constraints.languages).toEqual(['ko']);
    expect(parsed.hard_constraints.max_runtime_minutes).toBe(120);
    expect(parsed.hard_constraints.min_runtime_minutes).toBeNull();
    expect(parsed.hard_constraints.include_people).toEqual(['Leonardo DiCaprio']);
    expect(parsed.soft_preferences.tone_tags).toContain('mind-bending');
    expect(parsed.soft_preferences.reference_titles).toEqual(['Inception', 'Memento']);
    expect(parsed.ranking_hints.penalize_terms).toContain('not horror');
    expect(parsed.confidence).toBeGreaterThan(0.5);
  });

  it('applies exclusion precedence when include and exclude overlap', () => {
    const parsed = parseVibeQuery('romcom without romance between 90 and 120 minutes');

    expect(parsed.hard_constraints.include_genres).toEqual(['comedy']);
    expect(parsed.hard_constraints.exclude_genres).toEqual(['romance']);
    expect(parsed.hard_constraints.min_runtime_minutes).toBe(90);
    expect(parsed.hard_constraints.max_runtime_minutes).toBe(120);
    expect(parsed.hard_constraints.min_runtime_minutes).toBeLessThanOrEqual(parsed.hard_constraints.max_runtime_minutes || 0);
  });

  it('returns full schema with low confidence for empty input', () => {
    const parsed = parseVibeQuery('');

    expect(parsed.query_raw).toBe('');
    expect(parsed.intent_type).toBe('title_lookup');
    expect(parsed.hard_constraints.include_genres).toEqual([]);
    expect(parsed.soft_preferences.story_cues).toEqual([]);
    expect(parsed.ranking_hints.boost_keyword_terms).toEqual([]);
    expect(parsed.confidence).toBeLessThanOrEqual(0.1);
  });
});
