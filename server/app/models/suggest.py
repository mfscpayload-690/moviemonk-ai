"""Suggestion / type-ahead response models."""

from __future__ import annotations

from pydantic import BaseModel


class SuggestionItem(BaseModel):
    id: int
    title: str
    year: str | None = None
    type: str = "movie"  # movie | show | person
    media_type: str = "movie"  # movie | tv | person
    poster_url: str | None = None
    confidence: float = 0.0
    known_for_department: str | None = None
    known_for_titles: list[str] | None = None


class SuggestResponse(BaseModel):
    """Envelope for the /api/suggest endpoint."""
    ok: bool = True
    query: str
    results: list[SuggestionItem] = []
    suggestions: list[SuggestionItem] = []
    cached: bool = False
