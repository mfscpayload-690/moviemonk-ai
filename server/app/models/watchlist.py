"""Watchlist sharing models — Supabase-backed persistent storage.

Implements Spotify-style public/private visibility.  Only watchlists
explicitly marked as ``public`` by the user can be shared.
"""

from __future__ import annotations

from pydantic import BaseModel


class WatchlistShareItem(BaseModel):
    """A single item within a shared watchlist."""
    id: str
    saved_title: str
    movie: dict  # Full MovieData as dict (flexible schema)
    added_at: str


class WatchlistShareRequest(BaseModel):
    """Request body for creating a shared watchlist."""
    folder_name: str
    folder_icon: str | None = None
    items: list[WatchlistShareItem]
    visibility: str = "public"  # must be "public" to share


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
