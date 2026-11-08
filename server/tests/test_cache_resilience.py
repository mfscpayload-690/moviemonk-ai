"""Unit tests verifying Redis cache resilience and graceful degradation."""

from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.cache import get_cache, set_cache


class CacheResilienceTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_cache_handles_connection_reset_gracefully(self) -> None:
        """get_cache returns None without raising on ConnectionResetError."""
        mock_pool = AsyncMock()
        mock_pool.get.side_effect = ConnectionResetError("Connection lost")

        with patch("app.core.cache._redis_available", True), patch("app.core.cache._redis_pool", mock_pool):
            val = await get_cache("test_key")
            self.assertIsNone(val)

    async def test_get_cache_handles_redis_connection_error_gracefully(self) -> None:
        """get_cache returns None without raising on RedisConnectionError."""
        mock_pool = AsyncMock()
        mock_pool.get.side_effect = RedisConnectionError("Socket closed")

        with patch("app.core.cache._redis_available", True), patch("app.core.cache._redis_pool", mock_pool):
            val = await get_cache("test_key")
            self.assertIsNone(val)

    async def test_set_cache_handles_connection_reset_gracefully(self) -> None:
        """set_cache fails silently without raising on ConnectionResetError."""
        mock_pool = AsyncMock()
        mock_pool.set.side_effect = ConnectionResetError("Connection lost")

        with patch("app.core.cache._redis_available", True), patch("app.core.cache._redis_pool", mock_pool):
            # Must not raise
            await set_cache("test_key", {"data": 123}, ttl_seconds=60)

