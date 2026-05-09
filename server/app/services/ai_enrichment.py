"""AI enrichment service — creative summaries via Groq LLM.

Ported from api/ai.ts.  Generates summary_short, summary_medium,
summary_long_spoilers, suspense_breaker, and ai_notes.
"""

from __future__ import annotations

import itertools
import json
import logging
import re
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger("moviemonk.ai")

GROQ_API = "https://api.groq.com/openai/v1/chat/completions"
CREATIVE_MODEL = "llama-3.1-8b-instant"

CREATIVE_PROMPT = (
    "You are MovieMonk AI. Generate ONLY these JSON fields for the given movie/show:\n"
    '- summary_short: 150-200 chars, spoiler-free hook\n'
    '- summary_medium: 400-500 chars, spoiler-free plot\n'
    '- summary_long_spoilers: Full plot with ALL spoilers (start with "SPOILER WARNING")\n'
    '- suspense_breaker: One sentence revealing the twist/ending\n'
    '- ai_notes: Markdown trivia, quotes, themes, similar titles (3-5 bullets)\n'
    '- vibe_check: 2-4 word mood description (e.g. "Gritty, Neon, Tense")\n'
    '- best_watched_with: One short recommendation (e.g. "Late night with headphones")\n'
    '- technical_specs: object with {camera: str, aspect_ratio: str, audio_format: str}\n'
    "Return ONLY valid JSON. Be creative and insightful!"
)

_key_cycle: itertools.cycle | None = None


def _get_next_key() -> str | None:
    global _key_cycle
    settings = get_settings()
    keys = settings.groq_keys
    if not keys:
        return None
    if _key_cycle is None:
        _key_cycle = itertools.cycle(keys)
    return next(_key_cycle)


def _parse_json(raw: str) -> dict[str, Any] | None:
    try:
        cleaned = raw.strip()
        for prefix in ("```json", "```"):
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", raw)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
        return None


async def generate_creative_fields(
    title: str,
    year: str = "",
    genres: list[str] | None = None,
    overview: str = "",
    media_type: str = "movie",
    timeout_seconds: float = 9.0,
) -> dict[str, str]:
    empty = {
        "summary_short": "",
        "summary_medium": "",
        "summary_long_spoilers": "",
        "suspense_breaker": "",
        "ai_notes": "",
        "vibe_check": "",
        "best_watched_with": "",
        "technical_specs": {},
    }

    api_key = _get_next_key()
    if not api_key:
        logger.warning("No Groq keys — skipping AI enrichment")
        return empty

    user_content = (
        f"Type: {media_type.upper()}\nTitle: {title}\nYear: {year}\n"
        f"Genres: {', '.join(genres or ['Unknown'])}\nOverview: {overview}"
    )

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.post(
                GROQ_API,
                json={
                    "model": CREATIVE_MODEL,
                    "messages": [
                        {"role": "system", "content": CREATIVE_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500,
                    "response_format": {"type": "json_object"},
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("Groq error: %d", resp.status_code)
                return empty

            content = (
                resp.json().get("choices", [{}])[0]
                .get("message", {}).get("content", "")
            )
            parsed = _parse_json(content)
            if not parsed:
                return empty

            ai_notes = parsed.get("ai_notes") or ""
            if isinstance(ai_notes, list):
                ai_notes = "\n".join([str(item) for item in ai_notes])
            ai_notes = str(ai_notes)

            # Sanitize technical_specs
            specs = parsed.get("technical_specs")
            if isinstance(specs, str):
                try:
                    import json
                    specs = json.loads(specs)
                except:
                    specs = {}
            if not isinstance(specs, dict):
                specs = {}

            return {
                "summary_short": str(parsed.get("summary_short") or "")[:300],
                "summary_medium": str(parsed.get("summary_medium") or "")[:600],
                "summary_long_spoilers": str(parsed.get("summary_long_spoilers") or ""),
                "suspense_breaker": str(parsed.get("suspense_breaker") or "")[:300],
                "ai_notes": ai_notes,
                "vibe_check": str(parsed.get("vibe_check") or ""),
                "best_watched_with": str(parsed.get("best_watched_with") or ""),
                "technical_specs": specs,
            }
    except httpx.TimeoutException:
        logger.warning("Groq timed out after %.1fs", timeout_seconds)
        return empty
    except Exception:
        logger.exception("AI enrichment failed")
        return empty
