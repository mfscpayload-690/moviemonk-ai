"""Person intent detection — identifies person-focused queries.

Ported from services/personIntent.ts.
"""

from __future__ import annotations

import re

# Keywords that indicate a person-focused query
_ROLE_KEYWORDS = {
    "actor": "actor",
    "actress": "actress",
    "director": "director",
    "filmmaker": "director",
    "star": "actor",
    "starring": "actor",
    "directed by": "director",
    "directed": "director",
    "films of": "any",
    "movies of": "any",
    "filmography": "any",
    "movies by": "any",
    "shows by": "any",
}


def detect_person_intent(query: str) -> dict:
    """Analyse a query for person-focused intent.

    Returns::

        {
            "is_person_focused": bool,
            "requested_role": "any" | "actor" | "actress" | "director",
            "stripped_query": str,  # Query with role keywords removed
        }
    """
    q_lower = query.lower().strip()

    for keyword, role in _ROLE_KEYWORDS.items():
        if keyword in q_lower:
            stripped = re.sub(
                re.escape(keyword), "", q_lower, flags=re.IGNORECASE
            ).strip()
            return {
                "is_person_focused": True,
                "requested_role": role,
                "stripped_query": stripped or query,
            }

    return {
        "is_person_focused": False,
        "requested_role": "any",
        "stripped_query": query,
    }
