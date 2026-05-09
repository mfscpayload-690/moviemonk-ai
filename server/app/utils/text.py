"""Text processing utilities — Levenshtein distance, normalisation, etc.

Ported from the TypeScript utility functions scattered across
``resolveEntity.ts``, ``suggestRanking.ts``, and ``personIntent.ts``.
"""

from __future__ import annotations

import re
import unicodedata


def levenshtein(a: str, b: str) -> int:
    """Compute the Levenshtein edit distance between two strings."""
    if len(a) < len(b):
        return levenshtein(b, a)
    if len(b) == 0:
        return len(a)

    previous_row = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        current_row = [i + 1]
        for j, cb in enumerate(b):
            cost = 0 if ca == cb else 1
            current_row.append(
                min(
                    previous_row[j + 1] + 1,   # deletion
                    current_row[j] + 1,         # insertion
                    previous_row[j] + cost,     # substitution
                )
            )
        previous_row = current_row

    return previous_row[-1]


def normalise_title(text: str) -> str:
    """Normalise a title for comparison — lowercase, collapse whitespace,
    strip accents and common punctuation."""
    if not text:
        return ""
    # Unicode normalisation → strip accents
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = "".join(c for c in nfkd if not unicodedata.combining(c))
    # Lowercase, collapse whitespace, strip punctuation
    lower = ascii_text.lower().strip()
    lower = re.sub(r"[''\"`:;!?.,\-_/\\()[\]{}]", " ", lower)
    lower = re.sub(r"\s+", " ", lower).strip()
    return lower


def similarity_ratio(a: str, b: str) -> float:
    """Return a 0..1 similarity ratio based on Levenshtein distance."""
    if not a and not b:
        return 1.0
    max_len = max(len(a), len(b))
    if max_len == 0:
        return 1.0
    dist = levenshtein(a, b)
    return 1.0 - (dist / max_len)


def collapse_repeated_letters(text: str) -> str:
    """Collapse runs of 3+ identical letters to 2 (e.g. "goood" → "good")."""
    return re.sub(r"(.)\1{2,}", r"\1\1", text)


def extract_year(text: str) -> tuple[str, str | None]:
    """Extract a 4-digit year from a query string.

    Returns (cleaned_query, year_or_none).
    """
    match = re.search(r"\b(19\d{2}|20\d{2})\b", text)
    if match:
        year = match.group(1)
        cleaned = text[: match.start()] + text[match.end() :]
        return cleaned.strip(), year
    return text, None
