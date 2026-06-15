"""Movie/TV show detail response models.

Mirrors the TypeScript ``MovieData``, ``CastMember``, ``Crew``, etc.
from ``types.ts`` for wire-compatible responses.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class BaseResponseModel(BaseModel):
    """Base model for serialization — keeps snake_case as per frontend types.ts."""
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class CastMember(BaseResponseModel):
    id: int | None = None
    name: str
    role: str
    known_for: str = ""
    profile_url: str | None = None


class Crew(BaseResponseModel):
    director: str | None = None
    writer: str | None = None
    music: str | None = None
    producer: str | None = None


class Rating(BaseResponseModel):
    source: str
    value: str
    score: float | None = None  # Normalized score 0.0-10.0


class WatchOption(BaseResponseModel):
    platform: str
    link: str = ""
    type: str = "subscription"  # subscription | rent | free | buy
    confidence: int | None = None
    last_checked_at: str | None = None
    region: str | None = None


class TVShowSeason(BaseResponseModel):
    number: int
    name: str = ""
    episode_count: int = 0
    premiere_date: str | None = None
    end_date: str | None = None
    image: str | None = None
    summary: str | None = None


class TVShowEpisode(BaseResponseModel):
    id: int
    season: int
    episode: int
    name: str = ""
    airdate: str = ""
    runtime: int | None = None
    rating: float | None = None
    image: str | None = None
    summary: str | None = None


class TVShowData(BaseResponseModel):
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


class WikipediaEnrichment(BaseResponseModel):
    """Extra metadata sourced from Wikipedia."""
    plot_extended: str | None = None
    production_notes: str | None = None
    trivia: list[str] = []
    awards: list[str] = []
    cultural_context: str | None = None
    wikipedia_url: str | None = None


class TechnicalSpecs(BaseResponseModel):
    """Technical details for cinephiles."""
    camera: str | None = None
    aspect_ratio: str | None = None
    audio_format: str | None = None
    color: str | None = None  # e.g., Color | Black and White


class MovieFinancials(BaseResponseModel):
    """Financial data from TMDB/OMDB."""
    budget: int | None = None
    revenue: int | None = None


class RelatedTitle(BaseResponseModel):
    id: int
    title: str
    year: str | None = None
    media_type: str  # movie | tv
    poster_url: str | None = None
    popularity: float | None = None
    source: str = "tmdb-similar"


class MovieData(BaseResponseModel):
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


class DetailsResponse(BaseResponseModel):
    """Envelope for the /api/details endpoint."""
    ok: bool = True
    data: MovieData
    similar: list[RelatedTitle] = []
    sources: list[dict] = []
    cached: bool = False


class EpisodesResponse(BaseResponseModel):
    """Envelope for the /api/episodes/{tmdb_id}/{season_number} endpoint."""
    ok: bool = True
    episodes: list[TVShowEpisode] = []
    source: str = ""
    cached: bool = False

