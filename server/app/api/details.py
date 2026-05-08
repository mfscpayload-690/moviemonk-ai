"""Details endpoint — full movie/show details + multi-source enrichment.

This is the most data-rich endpoint.  Merge order:
1. TMDB  -> core metadata, cast, crew, images, trailer, watch providers
2. OMDB  -> IMDb/RT/Metacritic ratings
3. Wikipedia -> extended plot, production, trivia, awards
4. Wikimedia -> supplementary high-res images
5. Groq AI   -> creative summaries, suspense breaker, ai_notes
"""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Path

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.models.details import (
    CastMember, Crew, DetailsResponse, MovieData, Rating, RelatedTitle,
    WatchOption, WikipediaEnrichment,
)
from app.services import ai_enrichment, omdb, tmdb, wikimedia, wikipedia

logger = logging.getLogger("moviemonk.details")
router = APIRouter()

_CACHE_TTL = 24 * 3600  # 24 hours


def _get_preferred_region() -> str:
    return "US"


def _build_watch_options(providers_data: dict, region: str) -> list[WatchOption]:
    results = providers_data.get("results", {})
    priority = [region, "US", "IN", "GB"]
    selected = None
    for r in priority:
        if r in results:
            selected = results[r]
            break
    if not selected and results:
        selected = next(iter(results.values()))
    if not selected:
        return []

    seen: dict[str, WatchOption] = {}
    type_priority = {"subscription": 0, "free": 1, "rent": 2, "buy": 3}
    type_confidence = {"subscription": 86, "free": 83, "rent": 78, "buy": 76}

    for watch_type in ("flatrate", "free", "rent", "buy"):
        mapped_type = "subscription" if watch_type == "flatrate" else watch_type
        for entry in selected.get(watch_type, []):
            platform = (entry.get("provider_name") or "").strip()
            if not platform:
                continue
            key = platform.lower()
            if key not in seen:
                seen[key] = WatchOption(
                    platform=platform,
                    link=selected.get("link", ""),
                    type=mapped_type,
                    confidence=type_confidence.get(mapped_type, 70),
                    region=region,
                )
            elif type_priority.get(mapped_type, 9) < type_priority.get(seen[key].type, 9):
                seen[key].type = mapped_type

    options = sorted(seen.values(), key=lambda w: w.confidence or 0, reverse=True)
    return options[:8]


@router.get("/details/{media_type}/{tmdb_id}")
async def get_details(
    media_type: str = Path(..., description="movie or tv"),
    tmdb_id: int = Path(..., description="TMDB ID"),
):
    if media_type not in ("movie", "tv"):
        return api_error(400, "invalid_type", "media_type must be 'movie' or 'tv'")

    cache_key = build_cache_key("details_v2", {"mt": media_type, "id": tmdb_id})
    cached = await get_cache(cache_key)
    if cached:
        return {**cached, "cached": True}

    try:
        # Phase 1: Parallel TMDB fetches
        details_task = tmdb.get_details(media_type, tmdb_id)
        credits_task = tmdb.get_credits(media_type, tmdb_id)
        images_task = tmdb.get_images(media_type, tmdb_id)
        videos_task = tmdb.get_videos(media_type, tmdb_id)
        providers_task = tmdb.get_watch_providers(media_type, tmdb_id)
        ext_ids_task = tmdb.get_external_ids(media_type, tmdb_id)
        similar_task = tmdb.get_similar(media_type, tmdb_id)

        (details, credits, images, videos,
         providers, ext_ids, similar_raw) = await asyncio.gather(
            details_task, credits_task, images_task, videos_task,
            providers_task, ext_ids_task, similar_task,
            return_exceptions=True,
        )

        if isinstance(details, Exception):
            return api_error(502, "tmdb_error", f"TMDB details failed: {details}")

        # Extract core fields
        title = details.get("title") or details.get("name") or ""
        date_field = "release_date" if media_type == "movie" else "first_air_date"
        release_date = details.get(date_field, "")
        year = release_date[:4] if release_date else ""
        overview = details.get("overview", "")
        genres = [g.get("name", "") for g in details.get("genres", [])]

        spoken = details.get("spoken_languages", [])
        language = None
        if spoken:
            language = spoken[0].get("english_name") or spoken[0].get("name") or details.get("original_language")

        # Cast
        cast: list[CastMember] = []
        if isinstance(credits, dict):
            for actor in (credits.get("cast") or [])[:15]:
                if actor.get("name") and actor.get("character"):
                    cast.append(CastMember(
                        name=actor["name"],
                        role=actor["character"],
                        known_for=actor.get("known_for_department", "Acting"),
                        profile_url=tmdb.build_image_url(actor.get("profile_path"), "w185"),
                    ))

        # Crew
        crew = Crew()
        if isinstance(credits, dict):
            for member in credits.get("crew", []):
                job = member.get("job", "")
                if job in ("Director", "Series Director") and not crew.director:
                    crew.director = member.get("name", "")
                elif job in ("Writer", "Screenplay") and not crew.writer:
                    crew.writer = member.get("name", "")
                elif job == "Original Music Composer" and not crew.music:
                    crew.music = member.get("name", "")

        # Images
        poster_url = tmdb.build_image_url(details.get("poster_path"), "w500")
        backdrop_url = tmdb.build_image_url(details.get("backdrop_path"), "w780")
        extra_images: list[str] = []
        if isinstance(images, dict):
            seen_paths = {details.get("poster_path"), details.get("backdrop_path")}
            for bd in sorted(images.get("backdrops", []), key=lambda x: x.get("vote_count", 0), reverse=True):
                if len(extra_images) >= 6:
                    break
                fp = bd.get("file_path")
                if fp and fp not in seen_paths:
                    seen_paths.add(fp)
                    extra_images.append(tmdb.build_image_url(fp, "w780"))

        # Trailer
        trailer_url = ""
        if isinstance(videos, dict):
            for vid in videos.get("results", []):
                if vid.get("type") == "Trailer" and vid.get("site") == "YouTube":
                    trailer_url = f"https://www.youtube.com/watch?v={vid['key']}"
                    break

        # Watch providers
        watch_options: list[WatchOption] = []
        if isinstance(providers, dict):
            watch_options = _build_watch_options(providers, _get_preferred_region())

        # Phase 2: Parallel enrichment (OMDB + Wikipedia + Wikimedia + AI)
        imdb_id = ext_ids.get("imdb_id") if isinstance(ext_ids, dict) else None

        async def _empty_ratings():
            return []

        omdb_task = omdb.fetch_ratings(imdb_id) if imdb_id else _empty_ratings()
        wiki_task = wikipedia.enrich_movie(title, year)
        wikimedia_task = wikimedia.get_movie_images(title, year)
        ai_task = ai_enrichment.generate_creative_fields(title, year, genres, overview)

        ratings_raw, wiki_data, wiki_images, ai_fields = await asyncio.gather(
            omdb_task, wiki_task, wikimedia_task, ai_task,
            return_exceptions=True,
        )

        # Ratings
        ratings: list[Rating] = ratings_raw if isinstance(ratings_raw, list) else []

        # Wikipedia enrichment
        wiki_enrichment = None
        if isinstance(wiki_data, dict) and any(wiki_data.values()):
            wiki_enrichment = WikipediaEnrichment(
                plot_extended=wiki_data.get("plot_extended"),
                production_notes=wiki_data.get("production_notes"),
                trivia=wiki_data.get("trivia", []),
                awards=wiki_data.get("awards", []),
                cultural_context=wiki_data.get("cultural_context"),
                wikipedia_url=wiki_data.get("wikipedia_url"),
            )

        # Wikimedia supplementary images
        if isinstance(wiki_images, list):
            extra_images.extend(wiki_images[:4])

        # AI creative fields
        creative = ai_fields if isinstance(ai_fields, dict) else {}

        # Similar titles
        similar_titles: list[RelatedTitle] = []
        if isinstance(similar_raw, dict):
            for item in (similar_raw.get("results") or [])[:12]:
                t = item.get("title") or item.get("name") or ""
                if not t or item.get("id") == tmdb_id:
                    continue
                sim_mt = "tv" if item.get("name") and not item.get("title") else "movie"
                similar_titles.append(RelatedTitle(
                    id=item["id"],
                    title=t,
                    year=(item.get("release_date") or item.get("first_air_date") or "")[:4] or None,
                    media_type=sim_mt,
                    poster_url=tmdb.build_image_url(item.get("poster_path"), "w342"),
                    popularity=item.get("popularity"),
                ))

        movie_data = MovieData(
            tmdb_id=str(tmdb_id),
            title=title,
            year=year,
            language=language,
            type="show" if media_type == "tv" else "movie",
            media_type=media_type,
            genres=genres,
            poster_url=poster_url,
            backdrop_url=backdrop_url,
            trailer_url=trailer_url,
            ratings=ratings,
            cast=cast,
            crew=crew,
            summary_short=creative.get("summary_short", overview[:200] if overview else ""),
            summary_medium=creative.get("summary_medium", overview[:500] if overview else ""),
            summary_long_spoilers=creative.get("summary_long_spoilers", ""),
            suspense_breaker=creative.get("suspense_breaker", ""),
            where_to_watch=watch_options,
            extra_images=extra_images[:10],
            ai_notes=creative.get("ai_notes", ""),
            wikipedia=wiki_enrichment,
        )

        sources = [{"name": "TMDB", "url": f"https://www.themoviedb.org/{media_type}/{tmdb_id}"}]
        if imdb_id:
            sources.append({"name": "IMDb", "url": f"https://www.imdb.com/title/{imdb_id}"})
        if wiki_enrichment and wiki_enrichment.wikipedia_url:
            sources.append({"name": "Wikipedia", "url": wiki_enrichment.wikipedia_url})

        response = DetailsResponse(
            ok=True,
            data=movie_data,
            similar=similar_titles,
            sources=sources,
            cached=False,
        )

        await set_cache(cache_key, response.model_dump(), _CACHE_TTL)
        return response

    except Exception as exc:
        logger.exception("Details failed for %s/%d", media_type, tmdb_id)
        return api_error(500, "details_failed", f"Failed to fetch details: {exc}")
