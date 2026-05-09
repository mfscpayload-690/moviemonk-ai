"""Query parser — structured query parsing from natural language.

Ported from services/queryParser.ts.  Extracts title, year, type,
season/episode info, and language hints from raw queries.
"""

from __future__ import annotations

import re
from typing import Any


def parse_query(raw: str) -> dict[str, Any]:
    """Parse a raw search query into structured components.

    Returns::

        {
            "title": str,
            "year": str | None,
            "type": "movie" | "show" | None,
            "season": int | None,
            "episode": int | None,
            "has_season_info": bool,
            "language": str | None,
            "raw": str,
        }
    """
    q = raw.strip()
    result: dict[str, Any] = {
        "title": q,
        "year": None,
        "type": None,
        "season": None,
        "episode": None,
        "has_season_info": False,
        "language": None,
        "raw": raw,
    }

    if not q:
        return result

    # Extract year (e.g., "Inception 2010")
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", q)
    if year_match:
        result["year"] = year_match.group(1)
        q = q[:year_match.start()] + q[year_match.end():]
        q = q.strip()

    # Extract season/episode (e.g., "Breaking Bad S3E5" or "season 3 episode 5")
    se_match = re.search(
        r"[Ss](\d{1,2})\s*[Ee](\d{1,3})", q
    )
    if se_match:
        result["season"] = int(se_match.group(1))
        result["episode"] = int(se_match.group(2))
        result["has_season_info"] = True
        result["type"] = "show"
        q = q[:se_match.start()] + q[se_match.end():]
        q = q.strip()
    else:
        season_match = re.search(
            r"season\s+(\d{1,2})", q, re.IGNORECASE
        )
        if season_match:
            result["season"] = int(season_match.group(1))
            result["has_season_info"] = True
            result["type"] = "show"
            q = q[:season_match.start()] + q[season_match.end():]
            q = q.strip()

            ep_match = re.search(
                r"episode\s+(\d{1,3})", q, re.IGNORECASE
            )
            if ep_match:
                result["episode"] = int(ep_match.group(1))
                q = q[:ep_match.start()] + q[ep_match.end():]
                q = q.strip()

    # Detect type hints
    type_patterns = {
        "movie": r"\b(movie|film)\b",
        "show": r"\b(show|series|tv\s*show|tv\s*series)\b",
    }
    for media_type, pattern in type_patterns.items():
        if re.search(pattern, q, re.IGNORECASE):
            result["type"] = media_type
            q = re.sub(pattern, "", q, flags=re.IGNORECASE).strip()
            break

    # Detect language hints
    lang_map = {
        "hindi": "hi", "bollywood": "hi",
        "korean": "ko", "k-drama": "ko", "kdrama": "ko",
        "japanese": "ja", "anime": "ja",
        "tamil": "ta", "telugu": "te", "malayalam": "ml",
        "bengali": "bn", "marathi": "mr",
        "spanish": "es", "french": "fr", "german": "de",
        "chinese": "zh", "mandarin": "zh",
        "russian": "ru", "italian": "it",
    }
    for keyword, code in lang_map.items():
        if re.search(rf"\b{keyword}\b", q, re.IGNORECASE):
            result["language"] = code
            break

    # Clean up title
    result["title"] = re.sub(r"\s+", " ", q).strip()
    return result
