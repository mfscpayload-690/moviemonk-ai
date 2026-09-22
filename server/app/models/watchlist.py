"""Watchlist sharing models — Supabase-backed persistent storage.

Implements Spotify-style public/private visibility.  Only watchlists
explicitly marked as ``public`` by the user can be shared.
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, Field, field_validator


class WatchlistShareItem(BaseModel):
    """A single item within a shared watchlist."""
    id: str = Field(..., max_length=100)
    saved_title: str = Field(..., min_length=1, max_length=200)
    movie: dict[str, Any]  # Full MovieData as dict with bounded depth & size
    added_at: str = Field(..., max_length=50)

    @field_validator("movie")
    @classmethod
    def validate_movie(cls, v: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(v, dict):
            raise ValueError("movie must be a dictionary")

        # Guard against oversized individual movie objects (max 64 KB)
        try:
            dumped = json.dumps(v)
        except (TypeError, ValueError) as err:
            raise ValueError("movie must be JSON serializable") from err

        if len(dumped) > 65536:
            raise ValueError("movie payload exceeds maximum allowed size (64 KB)")

        # Guard against deeply nested recursive structures (max depth 5)
        def _check_depth(val: Any, current_depth: int = 1) -> None:
            if current_depth > 5:
                raise ValueError("movie payload exceeds maximum nesting depth (5)")
            if isinstance(val, dict):
                for child in val.values():
                    _check_depth(child, current_depth + 1)
            elif isinstance(val, list):
                for child in val:
                    _check_depth(child, current_depth + 1)

        _check_depth(v)
        return v


class WatchlistShareRequest(BaseModel):
    """Request body for creating a shared watchlist."""
    folder_name: str = Field(..., min_length=1, max_length=100)
    folder_icon: str | None = Field(default=None, max_length=50)
    items: list[WatchlistShareItem] = Field(..., min_length=1, max_length=500)
    visibility: str = Field(default="public", pattern=r"^(public|private)$")  # must be "public" to share


class WatchlistShareResponse(BaseModel):
    """Response after creating a share link."""
    ok: bool = True
    share_token: str
    share_url: str
    visibility: str = "public"
    item_count: int = 0
    created_at: str = ""


class SharedWatchlistView(BaseModel):
    """Public view of a shared watchlist (no auth required to view)."""
    folder_name: str
    folder_icon: str | None = None
    items: list[WatchlistShareItem] = []
    shared_by: str = ""
    created_at: str = ""
    item_count: int = 0
    visibility: str = "public"
