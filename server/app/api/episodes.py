"""Episodes endpoint — fetches lazy-loaded TV show episode details from TVMaze / TMDB.

Merges and queries TVMaze using the show's IMDb ID (via TMDB external IDs) or title,
falling back to TMDB's season details if TVMaze is unavailable.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Path

from app.core.cache import build_cache_key, get_cache, set_cache
from app.core.errors import api_error
from app.models.details import EpisodesResponse, TVShowEpisode
from app.services import tmdb, tvmaze

logger = logging.getLogger("moviemonk.episodes")
router = APIRouter()

_CACHE_TTL = 24 * 3600  # 24 hours cache


@router.get("/episodes/{tmdb_id}/{season_number}", response_model=EpisodesResponse)
async def get_season_episodes(
    tmdb_id: int = Path(..., description="TMDB ID of the TV Show"),
    season_number: int = Path(..., description="Season number (0 for Specials)"),
) -> Any:
    cache_key = build_cache_key("episodes_v1", {"id": tmdb_id, "season": season_number})
    cached = await get_cache(cache_key)
    if cached:
        # Return with cached flag set to True
        cached["cached"] = True
        return cached

    episodes: list[TVShowEpisode] = []
    source = ""

    try:
        # Step 1: Get IMDb ID from TMDB external IDs
        try:
            ext_ids = await tmdb.get_external_ids("tv", tmdb_id)
            imdb_id = ext_ids.get("imdb_id")
        except Exception:
            logger.exception("Failed to fetch TMDB external IDs for TV show %d", tmdb_id)
            imdb_id = None

        # Step 2: Try TVMaze IMDb lookup
        if imdb_id:
            show_data = await tvmaze.lookup_by_imdb(imdb_id)
            if show_data:
                tvmaze_id = show_data.get("id")
                if tvmaze_id:
                    raw_episodes = await tvmaze.get_episodes(tvmaze_id)
                    # Filter for desired season
                    episodes = [ep for ep in raw_episodes if ep.season == season_number]
                    source = "TVMaze (IMDb lookup)"

        # Step 3: Try TVMaze Title search fallback
        if not episodes:
            try:
                details = await tmdb.get_details("tv", tmdb_id)
                title = details.get("name")
            except Exception:
                logger.exception("Failed to fetch TMDB details for TV show %d", tmdb_id)
                title = None

            if title:
                show_data = await tvmaze.search_by_title(title)
                if show_data:
                    tvmaze_id = show_data.get("id")
                    if tvmaze_id:
                        raw_episodes = await tvmaze.get_episodes(tvmaze_id)
                        episodes = [ep for ep in raw_episodes if ep.season == season_number]
                        source = "TVMaze (Title search)"

        # Step 4: Fallback to TMDB season details API
        if not episodes:
            try:
                tmdb_season = await tmdb.get_season_details(tmdb_id, season_number)
                raw_tmdb_episodes = tmdb_season.get("episodes", [])
                episodes = []
                for ep in raw_tmdb_episodes:
                    rating_val = ep.get("vote_average")
                    if rating_val is not None:
                        try:
                            rating_val = float(rating_val)
                            if rating_val <= 0:
                                rating_val = None
                        except (ValueError, TypeError):
                            rating_val = None

                    episodes.append(
                        TVShowEpisode(
                            id=ep.get("id") or 0,
                            season=season_number,
                            episode=ep.get("episode_number") or 0,
                            name=ep.get("name") or "",
                            airdate=ep.get("air_date") or "",
                            runtime=ep.get("runtime"),
                            rating=rating_val,
                            image=tmdb.build_image_url(ep.get("still_path"), "w300"),
                            summary=ep.get("overview") or "",
                        )
                    )
                source = "TMDB (Fallback)"
            except Exception:
                logger.exception(
                    "Failed to fetch TMDB season fallback for show %d, season %d",
                    tmdb_id,
                    season_number,
                )

        # Build response envelope
        response = EpisodesResponse(
            ok=True,
            episodes=episodes,
            source=source,
            cached=False,
        )

        # Cache the response dict
        await set_cache(cache_key, response.model_dump(), _CACHE_TTL)
        return response

    except Exception:
        logger.exception("Failed to get episodes for show %d, season %d", tmdb_id, season_number)
        return api_error(500, "episodes_failed", "Failed to retrieve episode details")
