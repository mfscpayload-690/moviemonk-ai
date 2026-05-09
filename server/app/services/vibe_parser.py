"""Vibe query parser — NLP-based intent parsing via Groq LLM.

Ported from api/vibe.ts.  Parses natural-language movie queries into
structured hard/soft constraints for the discovery engine.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger("moviemonk.vibe")

GROQ_API = "https://api.groq.com/openai/v1/chat/completions"
VIBE_MODEL = "llama-3.1-8b-instant"

VIBE_SYSTEM_PROMPT = """You are a movie recommendation assistant. Parse the user's natural language query into structured search constraints.

Return ONLY valid JSON with this structure:
{
  "intent_type": "title_lookup" | "vibe_discovery" | "mixed",
  "hard_constraints": {
    "include_genres": [],
    "exclude_genres": [],
    "languages": [],
    "release_year_min": null,
    "release_year_max": null,
    "media_type": "movie" | "tv" | "any"
  },
  "soft_preferences": {
    "tone_tags": [],
    "story_cues": [],
    "pace": "slow" | "medium" | "fast" | "any",
    "intensity": "low" | "medium" | "high" | "any",
    "reference_titles": []
  },
  "ranking_hints": {
    "boost_overview_terms": [],
    "boost_keyword_terms": [],
    "penalize_terms": []
  },
  "fallback_query_terms": [],
  "confidence": 0.0-1.0,
  "notes_for_retrieval": []
}"""


async def parse_vibe_query(query: str, timeout: float = 8.0) -> dict[str, Any] | None:
    """Parse a vibe query using Groq LLM.  Returns None on failure."""
    settings = get_settings()
    api_key = settings.VIBE_SEARCH_API_KEY or (
        settings.groq_keys[0] if settings.groq_keys else None
    )
    if not api_key:
        logger.warning("No Groq keys for vibe parsing")
        return None

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                GROQ_API,
                json={
                    "model": VIBE_MODEL,
                    "messages": [
                        {"role": "system", "content": VIBE_SYSTEM_PROMPT},
                        {"role": "user", "content": query},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800,
                    "response_format": {"type": "json_object"},
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("Vibe parse failed: %d", resp.status_code)
                return None

            content = (
                resp.json().get("choices", [{}])[0]
                .get("message", {}).get("content", "")
            )
            cleaned = content.strip()
            for prefix in ("```json", "```"):
                if cleaned.startswith(prefix):
                    cleaned = cleaned[len(prefix):]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            return json.loads(cleaned.strip())

    except json.JSONDecodeError:
        logger.warning("Vibe parse returned invalid JSON")
        return None
    except Exception:
        logger.exception("Vibe parse error")
        return None


def local_vibe_fallback(query: str) -> dict[str, Any]:
    """Simple regex-based fallback when LLM is unavailable."""
    q = query.lower()
    genres = []
    tone_tags = []

    genre_map = {
        "comedy": "Comedy", "funny": "Comedy", "hilarious": "Comedy",
        "horror": "Horror", "scary": "Horror", "thriller": "Thriller",
        "romance": "Romance", "romantic": "Romance", "love": "Romance",
        "action": "Action", "adventure": "Adventure",
        "sci-fi": "Science Fiction", "scifi": "Science Fiction",
        "drama": "Drama", "mystery": "Mystery",
        "animation": "Animation", "animated": "Animation",
        "documentary": "Documentary",
    }

    for keyword, genre in genre_map.items():
        if keyword in q and genre not in genres:
            genres.append(genre)

    tone_map = {
        "feel-good": "uplifting", "uplifting": "uplifting",
        "dark": "dark", "gritty": "gritty",
        "wholesome": "wholesome", "intense": "intense",
        "mind-bending": "mind-bending", "thought-provoking": "thought-provoking",
    }
    for keyword, tone in tone_map.items():
        if keyword in q:
            tone_tags.append(tone)

    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", q)
    media_type = "tv" if any(w in q for w in ("show", "series", "tv")) else "any"

    return {
        "intent_type": "vibe_discovery",
        "hard_constraints": {
            "include_genres": genres,
            "exclude_genres": [],
            "languages": [],
            "release_year_min": int(year_match.group(1)) if year_match else None,
            "release_year_max": None,
            "media_type": media_type,
        },
        "soft_preferences": {
            "tone_tags": tone_tags,
            "story_cues": [],
            "pace": "any",
            "intensity": "any",
            "reference_titles": [],
        },
        "ranking_hints": {
            "boost_overview_terms": query.split(),
            "boost_keyword_terms": [],
            "penalize_terms": [],
        },
        "fallback_query_terms": query.split(),
        "confidence": 0.4,
        "notes_for_retrieval": ["Local fallback — LLM unavailable"],
    }
