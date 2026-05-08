"""Application configuration loaded from environment variables.

Uses pydantic-settings for validation. All secrets are loaded from
environment variables (HuggingFace Space Secrets in production).
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated application settings sourced from environment."""

    # ── TMDB (Required) ──
    TMDB_API_KEY: str
    TMDB_READ_TOKEN: str | None = None

    # ── OMDB (Optional) ──
    OMDB_API_KEY: str | None = None

    # ── AI Providers ──
    GROQ_API_KEY: str = ""
    VIBE_SEARCH_API_KEY: str | None = None
    PERPLEXITY_API_KEY: str | None = None

    # ── Web Search ──
    SERPAPI_KEY: str | None = None

    # ── Supabase (Server-side) ──
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Redis Cache ──
    REDIS_URL: str | None = None

    # ── CORS ──
    ALLOWED_ORIGINS: str = (
        "https://moviemonk-ai.vercel.app,http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def allowed_origin_list(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def groq_keys(self) -> list[str]:
        """Collect all available Groq API keys for round-robin."""
        keys: list[str] = []
        if self.GROQ_API_KEY and self.GROQ_API_KEY.strip():
            keys.append(self.GROQ_API_KEY.strip())
        if self.VIBE_SEARCH_API_KEY and self.VIBE_SEARCH_API_KEY.strip():
            val = self.VIBE_SEARCH_API_KEY.strip()
            if val not in keys:
                keys.append(val)
        return keys

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton Settings instance (cached)."""
    return Settings()  # type: ignore[call-arg]
