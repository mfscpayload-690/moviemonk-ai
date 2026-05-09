"""Person profile response models.

Mirrors the TypeScript ``PersonProfile``, ``PersonCredit`` etc.
from ``types.ts``.
"""

from __future__ import annotations

from pydantic import BaseModel


class PersonCredit(BaseModel):
    id: int
    media_type: str  # movie | tv
    title: str
    year: int | None = None
    role: str = ""
    role_bucket: str = "other"  # acting | directing | other
    character: str | None = None
    job: str | None = None
    department: str | None = None
    popularity: float | None = None
    poster_url: str | None = None


class RelatedPerson(BaseModel):
    id: int
    name: str
    known_for: str | None = None
    profile_url: str | None = None
    popularity: float | None = None
    source: str = "tmdb-co-star"


class PersonData(BaseModel):
    id: int
    name: str
    biography: str | None = None
    birthday: str | None = None
    place_of_birth: str | None = None
    profile_url: str | None = None
    known_for_department: str | None = None


class RoleDistribution(BaseModel):
    acting: int = 0
    directing: int = 0
    other: int = 0


class CareerSpan(BaseModel):
    start_year: int | None = None
    end_year: int | None = None
    active_years: int | None = None


class PersonResponse(BaseModel):
    """Envelope for the /api/person/{id} endpoint."""
    person: PersonData
    filmography: list[dict] = []
    top_work: list[PersonCredit] = []
    credits_all: list[PersonCredit] = []
    credits_acting: list[PersonCredit] = []
    credits_directing: list[PersonCredit] = []
    credits_other: list[PersonCredit] = []
    role_distribution: RoleDistribution = RoleDistribution()
    career_span: CareerSpan = CareerSpan()
    known_for_tags: list[str] = []
    related_people: list[RelatedPerson] = []
    sources: list[dict] = []
    cached: bool = False
