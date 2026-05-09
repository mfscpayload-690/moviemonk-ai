"""Wikipedia REST API client — enriches movie/person data.

Uses the English Wikipedia REST API (no API key required).
All results are in English regardless of the source film's language.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import httpx

logger = logging.getLogger("moviemonk.wikipedia")

WIKI_REST = "https://en.wikipedia.org/api/rest_v1"
WIKI_ACTION = "https://en.wikipedia.org/w/api.php"

_USER_AGENT = "MovieMonkBot/1.0 (https://moviemonk-ai.vercel.app)"


async def search_title(query: str, limit: int = 3) -> list[dict[str, str]]:
    """OpenSearch for Wikipedia page titles matching a query.

    Returns a list of {title, snippet, url} dicts.
    """
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                WIKI_ACTION,
                params={
                    "action": "opensearch",
                    "search": query,
                    "limit": limit,
                    "namespace": "0",
                    "format": "json",
                },
                headers={"User-Agent": _USER_AGENT},
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            # OpenSearch returns: [query, [titles], [snippets], [urls]]
            titles = data[1] if len(data) > 1 else []
            snippets = data[2] if len(data) > 2 else []
            urls = data[3] if len(data) > 3 else []

            return [
                {
                    "title": titles[i],
                    "snippet": snippets[i] if i < len(snippets) else "",
                    "url": urls[i] if i < len(urls) else "",
                }
                for i in range(len(titles))
            ]
    except Exception:
        logger.exception("Wikipedia search failed for %s", query)
        return []


async def get_page_summary(title: str) -> dict[str, Any] | None:
    """Fetch the summary (extract + thumbnail) for a Wikipedia page."""
    try:
        encoded = title.replace(" ", "_")
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{WIKI_REST}/page/summary/{encoded}",
                headers={"User-Agent": _USER_AGENT},
            )
            if resp.status_code != 200:
                return None
            return resp.json()
    except Exception:
        logger.exception("Wikipedia summary failed for %s", title)
        return None


def _strip_html(html: str) -> str:
    """Remove HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", html)


async def get_page_sections(title: str) -> dict[str, str]:
    """Fetch and parse named sections from a Wikipedia page.

    Returns a dict mapping section headings (lowercase) to their text content.
    Useful for extracting Plot, Production, Awards, Trivia, etc.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                WIKI_ACTION,
                params={
                    "action": "parse",
                    "page": title,
                    "prop": "sections|wikitext",
                    "format": "json",
                },
                headers={"User-Agent": _USER_AGENT},
            )
            if resp.status_code != 200:
                return {}

            data = resp.json()
            parse_data = data.get("parse", {})
            wikitext = parse_data.get("wikitext", {}).get("*", "")

            # Parse sections from wikitext
            sections: dict[str, str] = {}
            current_heading = "intro"
            current_content: list[str] = []

            for line in wikitext.split("\n"):
                heading_match = re.match(r"^==+\s*(.+?)\s*==+$", line)
                if heading_match:
                    if current_content:
                        sections[current_heading.lower()] = "\n".join(current_content).strip()
                    current_heading = heading_match.group(1)
                    current_content = []
                else:
                    # Strip wikitext markup for cleaner output
                    cleaned = re.sub(r"\[\[([^|\]]*\|)?([^\]]*)\]\]", r"\2", line)
                    cleaned = re.sub(r"\{\{[^}]*\}\}", "", cleaned)
                    cleaned = re.sub(r"'''?", "", cleaned)
                    cleaned = re.sub(r"<ref[^>]*>.*?</ref>", "", cleaned)
                    cleaned = re.sub(r"<ref[^/]*/>", "", cleaned)
                    if cleaned.strip():
                        current_content.append(cleaned.strip())

            if current_content:
                sections[current_heading.lower()] = "\n".join(current_content).strip()

            return sections

    except Exception:
        logger.exception("Wikipedia sections failed for %s", title)
        return {}


async def enrich_movie(title: str, year: str = "") -> dict[str, Any]:
    """Enrich a movie/show with Wikipedia data.

    Returns::

        {
            "plot_extended": str | None,
            "production_notes": str | None,
            "trivia": [str],
            "awards": [str],
            "cultural_context": str | None,
            "wikipedia_url": str | None,
            "thumbnail_url": str | None,
        }
    """
    result: dict[str, Any] = {
        "plot_extended": None,
        "production_notes": None,
        "trivia": [],
        "awards": [],
        "cultural_context": None,
        "wikipedia_url": None,
        "thumbnail_url": None,
    }

    # Search for the best matching page
    search_query = f"{title} {year} film" if year else f"{title} film"
    matches = await search_title(search_query, limit=3)
    if not matches:
        return result

    # Use the first match
    page_title = matches[0]["title"]
    result["wikipedia_url"] = matches[0].get("url", "")

    # Fetch summary for thumbnail
    summary = await get_page_summary(page_title)
    if summary:
        thumb = summary.get("thumbnail", {})
        result["thumbnail_url"] = thumb.get("source")

    # Fetch sections for detailed content
    sections = await get_page_sections(page_title)

    # Extract plot
    for key in ("plot", "plot summary", "synopsis"):
        if key in sections:
            result["plot_extended"] = sections[key][:2000]
            break

    # Extract production notes
    for key in ("production", "filming", "development"):
        if key in sections:
            result["production_notes"] = sections[key][:1500]
            break

    # Extract awards
    for key in ("awards", "awards and nominations", "accolades"):
        if key in sections:
            awards_text = sections[key]
            # Split into bullet points
            result["awards"] = [
                line.strip()
                for line in awards_text.split("\n")
                if line.strip() and len(line.strip()) > 10
            ][:10]
            break

    # Extract trivia / cultural context
    for key in ("reception", "cultural impact", "legacy"):
        if key in sections:
            result["cultural_context"] = sections[key][:1000]
            break

    return result


async def enrich_person(name: str) -> dict[str, Any]:
    """Enrich a person profile with Wikipedia biography data.

    Returns::

        {
            "biography_extended": str | None,
            "early_life": str | None,
            "career_highlights": str | None,
            "personal_life": str | None,
            "awards_summary": str | None,
            "wikipedia_url": str | None,
        }
    """
    result: dict[str, Any] = {
        "biography_extended": None,
        "early_life": None,
        "career_highlights": None,
        "personal_life": None,
        "awards_summary": None,
        "wikipedia_url": None,
    }

    matches = await search_title(name, limit=3)
    if not matches:
        return result

    page_title = matches[0]["title"]
    result["wikipedia_url"] = matches[0].get("url", "")

    # Fetch summary for biography overview
    summary = await get_page_summary(page_title)
    if summary:
        result["biography_extended"] = summary.get("extract", "")[:2000]

    # Fetch sections for detailed bio
    sections = await get_page_sections(page_title)

    for key in ("early life", "early life and education", "background"):
        if key in sections:
            result["early_life"] = sections[key][:1000]
            break

    for key in ("career", "career highlights", "filmography"):
        if key in sections:
            result["career_highlights"] = sections[key][:1500]
            break

    for key in ("personal life", "personal"):
        if key in sections:
            result["personal_life"] = sections[key][:1000]
            break

    for key in ("awards", "awards and nominations", "accolades"):
        if key in sections:
            result["awards_summary"] = sections[key][:1000]
            break

    return result
