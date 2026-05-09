"""Suggest ranking — candidate scoring for type-ahead suggestions.

Ported from services/suggestRanking.ts.
"""

from __future__ import annotations

from app.utils.text import normalise_title, similarity_ratio


def score_suggestion(
    candidate: dict,
    query: str,
) -> float:
    """Score a suggestion candidate (movie, TV, or person) against the query."""
    query_norm = normalise_title(query)
    title = candidate.get("title") or candidate.get("name") or ""
    title_norm = normalise_title(title)

    # Title similarity (0-1)
    sim = similarity_ratio(query_norm, title_norm)

    # Starts-with bonus
    starts_bonus = 0.15 if title_norm.startswith(query_norm) else 0.0

    # Popularity (log-scaled, 0-1)
    import math
    pop = candidate.get("popularity", 0)
    pop_score = min(math.log10(max(pop, 1)) / 2.5, 1.0)

    # Exact match bonus
    exact_bonus = 0.2 if query_norm == title_norm else 0.0

    return sim * 0.45 + pop_score * 0.25 + starts_bonus + exact_bonus
