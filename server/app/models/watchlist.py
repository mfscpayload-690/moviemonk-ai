"""Watchlist sharing models — Supabase-backed persistent storage.

Implements Spotify-style public/private visibility.  Only watchlists
explicitly marked as ``public`` by the user can be shared.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class WatchlistShareItem(BaseModel):
    """A single item within a shared watchlist."""
    id: str = Field(..., max_length=100)
    saved_title: str = Field(..., min_length=1, max_length=200)
    movie: dict  # Full MovieData as dict (flexible schema)
    added_at: str = Field(..., max_length=50)


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
