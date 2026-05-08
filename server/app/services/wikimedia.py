"""Wikimedia Commons API client — supplementary high-res images.

Fetches freely-licensed images from Wikimedia Commons to supplement
TMDB's image library.  No API key required.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger("moviemonk.wikimedia")

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
_USER_AGENT = "MovieMonkBot/1.0 (https://moviemonk-ai.vercel.app)"


async def search_images(
    query: str,
    limit: int = 6,
) -> list[str]:
    """Search Wikimedia Commons for images matching a query.

    Returns a list of high-resolution image URLs.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Step 1: Search for files
            resp = await client.get(
                COMMONS_API,
                params={
                    "action": "query",
                    "generator": "search",
                    "gsrsearch": f"{query} filetype:bitmap",
                    "gsrnamespace": "6",  # File namespace
                    "gsrlimit": str(limit),
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime",
                    "iiurlwidth": "800",
                    "format": "json",
                },
                headers={"User-Agent": _USER_AGENT},
            )

            if resp.status_code != 200:
                return []

            data: dict[str, Any] = resp.json()
            pages = data.get("query", {}).get("pages", {})

            urls: list[str] = []
            for page in pages.values():
                image_info = page.get("imageinfo", [])
                if not image_info:
                    continue
                info = image_info[0]
                mime = info.get("mime", "")
                # Only include actual images
                if mime.startswith("image/"):
                    thumb_url = info.get("thumburl", "")
                    if thumb_url:
                        urls.append(thumb_url)
                    elif info.get("url"):
                        urls.append(info["url"])

            return urls[:limit]

    except Exception:
        logger.exception("Wikimedia search failed for %s", query)
        return []


async def get_movie_images(title: str, year: str = "") -> list[str]:
    """Get supplementary images for a movie from Wikimedia Commons."""
    query = f'"{title}" {year} film' if year else f'"{title}" film'
    return await search_images(query, limit=4)


async def get_person_images(name: str) -> list[str]:
    """Get supplementary images for a person from Wikimedia Commons."""
    return await search_images(f'"{name}" actor OR director', limit=4)
