"""Person endpoint — profile + filmography + related people.

Ported from api/person/[id].ts.
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Path

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.models.person import (
    CareerSpan, PersonCredit, PersonData, PersonResponse, RelatedPerson, RoleDistribution,
)
from app.services import tmdb, wikipedia

logger = logging.getLogger("moviemonk.person")
router = APIRouter()

_CACHE_TTL = 24 * 3600  # 24 hours


def _infer_role_bucket(credit: dict) -> str:
    dept = (credit.get("department") or credit.get("known_for_department") or "").lower()
    job = (credit.get("job") or "").lower()
    has_char = bool(credit.get("character"))
    if has_char or "acting" in dept or "actor" in job or "actress" in job:
        return "acting"
    if "director" in job or "direct" in dept:
        return "directing"
    return "other"


def _map_credit(credit: dict) -> PersonCredit | None:
    mt = "tv" if credit.get("media_type") == "tv" else "movie"
    title = (credit.get("name") or credit.get("title") or
             credit.get("original_name") or credit.get("original_title") or "")
    if not credit.get("id") or not title:
        return None

    date = credit.get("first_air_date") if mt == "tv" else credit.get("release_date")
    year = int(date[:4]) if isinstance(date, str) and len(date) >= 4 else None

    bucket = _infer_role_bucket(credit)
    role = ("cast" if bucket == "acting"
            else credit.get("job") or "Director" if bucket == "directing"
            else credit.get("job") or credit.get("department") or "crew")

    return PersonCredit(
        id=credit["id"],
        media_type=mt,
        title=title,
        year=year,
        role=role,
        role_bucket=bucket,
        character=credit.get("character"),
        job=credit.get("job"),
        department=credit.get("department"),
        popularity=credit.get("popularity"),
        poster_url=tmdb.build_image_url(credit.get("poster_path"), "w342"),
    )


def _dedupe_credits(credits: list[PersonCredit]) -> list[PersonCredit]:
    seen: set[str] = set()
    unique: list[PersonCredit] = []
    for c in credits:
        key = f"{c.media_type}:{c.id}:{c.role_bucket}:{c.role}"
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


async def _fetch_related_people(person_id: int) -> list[RelatedPerson]:
    """Find related people based on shared credits."""
    try:
        credits_data = await tmdb.get_person_combined_credits(person_id)
        all_works = (credits_data.get("cast") or []) + (credits_data.get("crew") or [])
        all_works = [w for w in all_works if w.get("id") and w.get("media_type") in ("movie", "tv")]
        all_works.sort(key=lambda w: w.get("popularity", 0), reverse=True)

        # Deduplicate works
        seen_works: set[str] = set()
        top_works = []
        for w in all_works:
            key = f"{w['media_type']}:{w['id']}"
            if key not in seen_works:
                seen_works.add(key)
                top_works.append(w)
                if len(top_works) >= 8:
                    break

        related_map: dict[int, dict] = {}

        async def fetch_credits_for_work(work: dict) -> None:
            try:
                creds = await tmdb.get_credits(work["media_type"], work["id"])
                cast = (creds.get("cast") or [])[:20]
                crew_list = [
                    m for m in (creds.get("crew") or [])
                    if m.get("job") in ("Director", "Writer", "Screenplay", "Producer")
                ][:8]

                for member in cast + crew_list:
                    mid = member.get("id")
                    if not mid or mid == person_id or not member.get("name"):
                        continue
                    if mid in related_map:
                        related_map[mid]["overlap"] += 1
                        if (member.get("popularity") or 0) > (related_map[mid].get("popularity") or 0):
                            related_map[mid]["popularity"] = member["popularity"]
                    else:
                        related_map[mid] = {
                            "id": mid,
                            "name": member["name"],
                            "profile_path": member.get("profile_path"),
                            "popularity": member.get("popularity"),
                            "known_for": (member.get("known_for_department")
                                         or member.get("job")
                                         or member.get("character")),
                            "overlap": 1,
                        }
            except Exception:
                pass

        await asyncio.gather(*(fetch_credits_for_work(w) for w in top_works))

        sorted_related = sorted(
            related_map.values(),
            key=lambda r: (r["overlap"], r.get("popularity") or 0),
            reverse=True,
        )

        return [
            RelatedPerson(
                id=r["id"],
                name=r["name"],
                known_for=r.get("known_for"),
                profile_url=tmdb.build_image_url(r.get("profile_path"), "w185"),
                popularity=r.get("popularity"),
            )
            for r in sorted_related[:18]
        ]
    except Exception:
        logger.exception("Related people fetch failed")
        return []


@router.get("/person/{person_id}")
async def get_person(person_id: int = Path(...)):
    cache_key = build_cache_key("person_v2", {"id": person_id})
    cached = await get_cache(cache_key)
    if cached:
        return {**cached, "cached": True}

    try:
        person_data, credits_data = await asyncio.gather(
            tmdb.get_person(person_id),
            tmdb.get_person_combined_credits(person_id),
        )

        combined_raw = (credits_data.get("cast") or []) + (credits_data.get("crew") or [])
        all_credits = _dedupe_credits(
            [c for c in ((_map_credit(r) for r in combined_raw)) if c is not None]
        )
        all_credits.sort(key=lambda c: (c.year or 0, c.popularity or 0), reverse=True)

        acting = [c for c in all_credits if c.role_bucket == "acting"]
        directing = [c for c in all_credits if c.role_bucket == "directing"]
        other = [c for c in all_credits if c.role_bucket == "other"]
        top_work = sorted(all_credits, key=lambda c: c.popularity or 0, reverse=True)[:12]

        filmography = [
            {"id": c.id, "title": c.title, "year": c.year, "role": c.role,
             "media_type": c.media_type, "character": c.character, "poster_url": c.poster_url}
            for c in all_credits
        ]

        years = [c.year for c in all_credits if c.year]
        start_year = min(years) if years else None
        end_year = max(years) if years else None
        active_years = max(1, end_year - start_year + 1) if start_year and end_year else None

        # Build known-for tags
        tags: list[str] = []
        kfd = person_data.get("known_for_department", "")
        if kfd:
            tags.append(kfd)
        if acting:
            tags.append("Acting")
        if directing:
            tags.append("Directing")
        media_types = {c.media_type for c in all_credits}
        if "movie" in media_types and "tv" in media_types:
            tags.append("Film & TV")
        elif "tv" in media_types:
            tags.append("TV")
        elif "movie" in media_types:
            tags.append("Film")
        tags = list(dict.fromkeys(tags))[:8]

        # Parallel: related people + Wikipedia enrichment
        related_task = _fetch_related_people(person_id)
        wiki_task = wikipedia.enrich_person(person_data.get("name", ""))
        related_people, wiki_data = await asyncio.gather(
            related_task, wiki_task, return_exceptions=True,
        )
        related = related_people if isinstance(related_people, list) else []

        # Merge Wikipedia bio if TMDB bio is short
        biography = person_data.get("biography", "")
        if isinstance(wiki_data, dict) and wiki_data.get("biography_extended"):
            if len(biography) < 200:
                biography = wiki_data["biography_extended"]

        person_obj = PersonData(
            id=person_data["id"],
            name=person_data.get("name", ""),
            biography=biography,
            birthday=person_data.get("birthday"),
            place_of_birth=person_data.get("place_of_birth"),
            profile_url=tmdb.build_image_url(person_data.get("profile_path"), "w342"),
            known_for_department=kfd,
        )

        sources = [{"name": "TMDB", "url": f"https://www.themoviedb.org/person/{person_id}"}]
        if isinstance(wiki_data, dict) and wiki_data.get("wikipedia_url"):
            sources.append({"name": "Wikipedia", "url": wiki_data["wikipedia_url"]})

        response = PersonResponse(
            person=person_obj,
            filmography=filmography,
            top_work=top_work,
            credits_all=all_credits,
            credits_acting=acting,
            credits_directing=directing,
            credits_other=other,
            role_distribution=RoleDistribution(
                acting=len(acting), directing=len(directing), other=len(other),
            ),
            career_span=CareerSpan(
                start_year=start_year, end_year=end_year, active_years=active_years,
            ),
            known_for_tags=tags,
            related_people=related,
            sources=sources,
            cached=False,
        )

        await set_cache(cache_key, response.model_dump(), _CACHE_TTL)
        return response

    except Exception as exc:
        logger.exception("Person fetch failed for id=%d", person_id)
        return api_error(500, "person_failed", "Failed to fetch person details")
