"""Search result response models.

Mirrors the TypeScript ``SearchResult``, ``SearchPageResponse`` etc.
from ``types.ts``.
"""

from __future__ import annotations

from pydantic import BaseModel


class PersonSearchCandidate(BaseModel):
    id: int
    name: str
    type: str = "person"
    score: float = 0.0
    confidence: float = 0.0
    popularity: float | None = None
    role_match: str | None = None  # match | mismatch | neutral
    known_for_department: str | None = None
    known_for_titles: list[str] | None = None
    profile_url: str | None = None


class SearchResult(BaseModel):
    id: int
    title: str
    year: str | None = None
    type: str = "movie"  # movie | show
    media_type: str = "movie"  # movie | tv
    poster_url: str | None = None
    backdrop_url: str | None = None
    overview: str | None = None
    summary_snippet: str | None = None
    rating: float | None = None
    genre_ids: list[int] = []
    genres: list[str] = []
    confidence: float = 0.0
    popularity: float | None = None
    original_language: str | None = None
    vibe_score: float | None = None
    match_reasons: list[str] = []


class VibeInfo(BaseModel):
    intent_type: str = "title_lookup"
    summary: str = ""
    signals: list[str] = []


class AppliedFilters(BaseModel):
    type: str = "all"
    sort_by: str = "popularity.desc"
    genres: list[int] = []
    year_min: int | None = None
    year_max: int | None = None
    rating_min: float | None = None


class SearchPageResponse(BaseModel):
    """Envelope for the /api/search endpoint."""
    ok: bool = True
    query: str
    page: int = 1
    total_pages: int = 1
    total_results: int = 0
    search_mode: str | None = None  # keyword | vibe | mixed
    hero: SearchResult | None = None
    results: list[SearchResult] = []
    people: list[PersonSearchCandidate] = []
    did_you_mean: list[str] = []
    vibe: VibeInfo | None = None
    applied_filters: AppliedFilters | None = None
