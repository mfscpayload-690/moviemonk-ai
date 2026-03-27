function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInlineMarkdown(text: string): string {
  let value = text;
  value = value.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*(.+?)\*/g, '<em>$1</em>');
  value = value.replace(/_(.+?)_/g, '<em>$1</em>');
  value = value.replace(/`(.+?)`/g, '<code>$1</code>');
  return value;
}

function preprocess(raw: string): string {
  let value = raw.replace(/\r\n?/g, '\n').trim();

  // Convert dot-separated label prose into readable blocks.
  value = value.replace(/([.!?])\s+([A-Z][A-Za-z0-9 '&()\/-]{2,48}:)/g, '$1\n$2');

  // Normalize bullet symbols from model responses.
  value = value.replace(/\s+•\s+/g, '\n- ');

  return value;
}

export function formatAiNotesHtml(input: string): string {
  if (!input || !input.trim()) return '<p>No notes available.</p>';

  const lines = preprocess(input).split('\n');
  const blocks: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const escaped = escapeHtml(paragraphLines.join(' ').trim());
    blocks.push(`<p>${formatInlineMarkdown(escaped)}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length || !listType) return;
    blocks.push(`<${listType}>${listItems.join('')}</${listType}>`);
    listItems = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${formatInlineMarkdown(escapeHtml(h3Match[1].trim()))}</h3>`);
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${formatInlineMarkdown(escapeHtml(h2Match[1].trim()))}</h2>`);
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${formatInlineMarkdown(escapeHtml(h1Match[1].trim()))}</h2>`);
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(`<li>${formatInlineMarkdown(escapeHtml(numberedMatch[1].trim()))}</li>`);
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(`<li>${formatInlineMarkdown(escapeHtml(bulletMatch[1].trim()))}</li>`);
      continue;
    }

    const labeledMatch = line.match(/^([A-Z][A-Za-z0-9 '&()\/-]{2,48}):\s*(.+)$/);
    if (labeledMatch) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${escapeHtml(labeledMatch[1].trim())}</h3>`);
      blocks.push(`<p>${formatInlineMarkdown(escapeHtml(labeledMatch[2].trim()))}</p>`);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join('');
}