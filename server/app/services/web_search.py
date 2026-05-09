"""Web search service — DuckDuckGo + Wikipedia + IMDB.

Ported from api/websearch.ts.
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import unquote

import httpx

from app.services import wikipedia as wiki_service

logger = logging.getLogger("moviemonk.websearch")

_DDG_URL = "https://html.duckduckgo.com/html/"
_DDG_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
)


async def search_duckduckgo(query: str, limit: int = 5) -> list[dict[str, str]]:
    """Scrape DuckDuckGo HTML search results."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                _DDG_URL,
                params={"q": query},
                headers={"User-Agent": _DDG_UA},
            )
            if resp.status_code != 200:
                return []

        html = resp.text
        pattern = (
            r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>'
            r'[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)</a>'
        )
        results: list[dict[str, str]] = []
        for match in re.finditer(pattern, html, re.IGNORECASE):
            if len(results) >= limit:
                break
            raw_url = re.sub(r"^//duckduckgo\.com/l/\?uddg=", "", match.group(1))
            title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
            snippet = (
                re.sub(r"<[^>]+>", "", match.group(3))
                .replace("&quot;", '"').replace("&amp;", "&").strip()
            )
            if not title or not snippet:
                continue
            try:
                decoded = unquote(raw_url)
                if decoded.startswith(("http://", "https://")):
                    results.append({"title": title, "snippet": snippet, "url": decoded})
            except Exception:
                continue
        return results
    except Exception:
        logger.exception("DuckDuckGo search failed")
        return []


async def search_imdb(query: str) -> list[dict[str, str]]:
    """Search IMDB via DuckDuckGo site filter."""
    return await search_duckduckgo(f"site:imdb.com {query}", limit=3)


async def web_search(
    query: str,
    sources: str = "all",
) -> dict[str, Any]:
    """Aggregate search across DuckDuckGo, Wikipedia, and IMDB."""
    source_list = [s.strip() for s in sources.split(",")]
    results: dict[str, list] = {}

    import asyncio
    tasks = []

    if "all" in source_list or "web" in source_list:
        tasks.append(("web", search_duckduckgo(query, 5)))
    if "all" in source_list or "wikipedia" in source_list:
        tasks.append(("wikipedia", wiki_service.search_title(query, 3)))
    if "all" in source_list or "imdb" in source_list:
        tasks.append(("imdb", search_imdb(query)))

    gathered = await asyncio.gather(
        *(t[1] for t in tasks), return_exceptions=True
    )

    for i, (name, _) in enumerate(tasks):
        result = gathered[i]
        results[name] = result if isinstance(result, list) else []

    total = sum(len(v) for v in results.values())
    return {"ok": True, "query": query, "results": results, "total": total}
