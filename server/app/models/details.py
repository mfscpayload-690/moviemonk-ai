"""Movie/TV show detail response models.

Mirrors the TypeScript ``MovieData``, ``CastMember``, ``Crew``, etc.
from ``types.ts`` for wire-compatible responses.
"""

from __future__ import annotations

from pydantic import BaseModel


class CastMember(BaseModel):
    name: str
    role: str
    known_for: str = ""
    profile_url: str | None = None


class Crew(BaseModel):
    director: str = ""
    writer: str = ""
    music: str = ""


class Rating(BaseModel):
    source: str
    score: str


class WatchOption(BaseModel):
    platform: str
    link: str = ""
    type: str = "subscription"  # subscription | rent | free | buy
    confidence: int | None = None
    last_checked_at: str | None = None
    region: str | None = None


class TVShowSeason(BaseModel):
    number: int
    name: str = ""
    episode_count: int = 0
    premiere_date: str | None = None
    end_date: str | None = None
    image: str | None = None
    summary: str | None = None


class TVShowEpisode(BaseModel):
    id: int
    season: int
    episode: int
    name: str = ""
    airdate: str = ""
    runtime: int | None = None
    rating: float | None = None
    image: str | None = None
    summary: str | None = None


class TVShowData(BaseModel):
    status: str = ""
    premiered: str | None = None
    ended: str | None = None
    total_seasons: int = 0
    total_episodes: int = 0
    network: str = ""
    language: str = ""
    official_site: str | None = None
    seasons: list[TVShowSeason] = []
    episodes: list[TVShowEpisode] = []


class WikipediaEnrichment(BaseModel):
    """Extra metadata sourced from Wikipedia."""
    plot_extended: str | None = None
    production_notes: str | None = None
    trivia: list[str] = []
    awards: list[str] = []
    cultural_context: str | None = None
    wikipedia_url: str | None = None


class TechnicalSpecs(BaseModel):
    """Technical details for cinephiles."""
    camera: str | None = None
    aspect_ratio: str | None = None
    audio_format: str | None = None
    color: str | None = None  # e.g., Color | Black and White


class MovieFinancials(BaseModel):
    """Financial data from TMDB/OMDB."""
    budget: int | None = None
    revenue: int | None = None


class MovieData(BaseModel):
    """Full movie/show detail payload — wire-compatible with the
    TypeScript ``MovieData`` interface in ``types.ts``."""
    tmdb_id: str | None = None
    title: str
    year: str = ""
    language: str | None = None
    type: str = "movie"  # movie | show | song | franchise
    media_type: str | None = None
    genres: list[str] = []
    poster_url: str = ""
    backdrop_url: str = ""
    trailer_url: str = ""
    ratings: list[Rating] = []
    cast: list[CastMember] = []
    crew: Crew = Crew()
    summary_short: str = ""
    summary_medium: str = ""
    summary_long_spoilers: str = ""
    suspense_breaker: str = ""
    where_to_watch: list[WatchOption] = []
    extra_images: list[str] = []
    ai_notes: str = ""
    tv_show: TVShowData | None = None

    # Wikipedia enrichment (new)
    wikipedia: WikipediaEnrichment | None = None

    # Premium Metadata (Financials & Tech)
    budget: str | None = None
    revenue: str | None = None
    technical_specs: TechnicalSpecs | None = None

    # Contextual & Safety
    content_rating: str | None = None
    vibe_check: str | None = None
    content_advisory: list[str] = []
    best_watched_with: str | None = None

    # Similar titles (attached to MovieData for easier frontend access)
    related: list[RelatedTitle] = []


class RelatedTitle(BaseModel):
    id: int
    title: str
    year: str | None = None
    media_type: str  # movie | tv
    poster_url: str | None = None
    popularity: float | None = None
    source: str = "tmdb-similar"


class DetailsResponse(BaseModel):
    """Envelope for the /api/details endpoint."""
    ok: bool = True
    data: MovieData
    similar: list[RelatedTitle] = []
    sources: list[dict] = []
    cached: bool = False
