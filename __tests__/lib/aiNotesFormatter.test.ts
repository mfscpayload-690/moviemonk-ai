import { hasValidAiNotes, formatAiNotesHtml } from '../../lib/aiNotesFormatter';

describe('aiNotesFormatter failsafe silencing', () => {
  it('returns false for null, undefined, and empty/whitespace inputs', () => {
    expect(hasValidAiNotes(null)).toBe(false);
    expect(hasValidAiNotes(undefined)).toBe(false);
    expect(hasValidAiNotes('')).toBe(false);
    expect(hasValidAiNotes('   \n\t  ')).toBe(false);
  });

  it('returns false for common fallback phrases and placeholder text', () => {
    expect(hasValidAiNotes('No notes available.')).toBe(false);
    expect(hasValidAiNotes('No notes available')).toBe(false);
    expect(hasValidAiNotes('no notes available')).toBe(false);
    expect(hasValidAiNotes('No trivia available.')).toBe(false);
    expect(hasValidAiNotes('No trivia available')).toBe(false);
    expect(hasValidAiNotes('N/A')).toBe(false);
    expect(hasValidAiNotes('None')).toBe(false);
    expect(hasValidAiNotes('none available')).toBe(false);
    expect(hasValidAiNotes('No data available.')).toBe(false);
    expect(hasValidAiNotes('<p>No notes available.</p>')).toBe(false);
    expect(hasValidAiNotes('no notes or trivia available')).toBe(false);
  });

  it('returns true for legitimate trivia and notes', () => {
    expect(hasValidAiNotes('Filmed entirely on location in Iceland using IMAX cameras.')).toBe(true);
    expect(hasValidAiNotes('Fun Fact: The director wrote the screenplay in just two weeks.')).toBe(true);
    expect(hasValidAiNotes('- Oscar nominee for Best Visual Effects\n- Budget of $150M')).toBe(true);
  });

  it('formatAiNotesHtml returns empty string for invalid notes and formatted HTML for valid notes', () => {
    expect(formatAiNotesHtml('')).toBe('');
    expect(formatAiNotesHtml('No notes available.')).toBe('');
    expect(formatAiNotesHtml(null as any)).toBe('');

    const formatted = formatAiNotesHtml('### Production Trivia\nFilmed in 70mm.');
    expect(formatted).toContain('<h3>Production Trivia</h3>');
    expect(formatted).toContain('<p>Filmed in 70mm.</p>');
  });
});

