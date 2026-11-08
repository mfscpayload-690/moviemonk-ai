"""Unit tests for Groq API proxy failover and error deduplication."""

from __future__ import annotations

import unittest
from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

from app.main import create_app


class GroqProxyFailoverTests(unittest.TestCase):
    app: Any
    client: TestClient

    @classmethod
    def setUpClass(cls) -> None:
        cls.app = create_app()
        cls.client = TestClient(cls.app)

    @patch("app.api.groq_proxy.get_settings")
    @patch("httpx.AsyncClient.post")
    def test_groq_proxy_failover_on_401(self, mock_post: AsyncMock, mock_settings: Any) -> None:
        """When the first key returns 401 expired, failover to the second key succeeds."""
        mock_settings.return_value.groq_keys = ["expired-key-1", "valid-key-2"]

        resp_401 = httpx.Response(
            status_code=401,
            text='{"error":{"message":"Invalid API Key","type":"invalid_request_error","code":"expired_api_key"}}',
            request=httpx.Request("POST", "https://api.groq.com"),
        )
        resp_200 = httpx.Response(
            status_code=200,
            json={"choices": [{"message": {"role": "assistant", "content": "Hello movie lover!"}}]},
            request=httpx.Request("POST", "https://api.groq.com"),
        )

        mock_post.side_effect = [resp_401, resp_200]

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": "recommend a movie"}],
        }

        response = self.client.post("/api/groq", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("choices", data)
        self.assertEqual(mock_post.call_count, 2)
