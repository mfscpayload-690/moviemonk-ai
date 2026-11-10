"""Unit tests verifying /api/query resolution with year extraction and direct ID lookup for full plot."""

from __future__ import annotations

import unittest
from typing import Any
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import create_app


class QueryFullPlotTests(unittest.TestCase):
    app: Any
    client: TestClient

    @classmethod
    def setUpClass(cls) -> None:
        cls.app = create_app()
        cls.client = TestClient(cls.app)

    @patch("app.api.query.tmdb.get_details")
    @patch("app.api.query.ai_enrichment.generate_creative_fields")
    def test_query_full_plot_with_direct_id(
        self, mock_enrich: AsyncMock, mock_details: AsyncMock
    ) -> None:
        """Query with mode='full_plot' and direct id resolves without text search."""
        mock_details.return_value = {
            "id": 27205,
            "title": "Inception",
            "release_date": "2010-07-15",
            "genres": [{"id": 28, "name": "Action"}],
            "overview": "Cobb is a thief...",
        }
        mock_enrich.return_value = {
            "summary_short": "A mind-bending heist",
            "summary_long_spoilers": "SPOILER WARNING: Mal is dead and Cobb wakes up.",
        }

        payload = {
            "q": "Inception",
            "id": 27205,
            "type": "movie",
            "mode": "full_plot",
        }

        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(
            data.get("summary", {}).get("summary_long"),
            "SPOILER WARNING: Mal is dead and Cobb wakes up.",
        )
        mock_details.assert_called_once_with("movie", 27205)

    @patch("app.api.query.tmdb.get_details")
    @patch("app.api.query.ai_enrichment.generate_creative_fields")
    def test_query_normalizes_show_type_to_tv(
        self, mock_enrich: AsyncMock, mock_details: AsyncMock
    ) -> None:
        """Query with type='show' normalizes to 'tv' for TMDB lookup."""
        mock_details.return_value = {
            "id": 1399,
            "name": "Game of Thrones",
            "overview": "Winter is coming...",
        }
        mock_enrich.return_value = {
            "summary_short": "Dragons and kingdoms",
            "summary_long_spoilers": "SPOILER: Bran becomes king.",
        }

        payload = {
            "q": "Game of Thrones",
            "id": 1399,
            "type": "show",
            "mode": "full_plot",
        }

        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 200)
        mock_details.assert_called_once_with("tv", 1399)

    def test_query_rejects_non_numeric_id(self) -> None:
        """Query with non-numeric id returns 400 Bad Request."""
        payload = {
            "q": "Test",
            "id": "not-a-number",
            "type": "movie",
            "mode": "full_plot",
        }
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_query_rejects_invalid_type(self) -> None:
        """Query with invalid type returns 400 Bad Request."""
        payload = {
            "q": "Test",
            "id": 12345,
            "type": "invalid_kind",
            "mode": "full_plot",
        }
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 400)


class EntityResolverTests(unittest.IsolatedAsyncioTestCase):
    @patch("app.services.entity_resolver.tmdb.search_movie")
    @patch("app.services.entity_resolver.tmdb.search_tv")
    @patch("app.services.entity_resolver.tmdb.search_person")
    async def test_entity_resolver_extracts_year(
        self, mock_person: AsyncMock, mock_tv: AsyncMock, mock_movie: AsyncMock
    ) -> None:
        """Entity resolver extracts year in parentheses and passes clean query to TMDB."""
        from app.services.entity_resolver import resolve

        mock_movie.return_value = {
            "results": [
                {
                    "id": 27205,
                    "title": "Inception",
                    "popularity": 80.0,
                    "vote_average": 8.4,
                }
            ]
        }
        mock_tv.return_value = {"results": []}
        mock_person.return_value = {"results": []}

        res = await resolve("Inception (2010)")
        self.assertEqual(res["id"], 27205)
        mock_movie.assert_called_once_with("Inception", year="2010")

    @patch("app.services.entity_resolver.tmdb.search_movie")
    @patch("app.services.entity_resolver.tmdb.search_tv")
    @patch("app.services.entity_resolver.tmdb.search_person")
    async def test_entity_resolver_preserves_title_numbers(
        self, mock_person: AsyncMock, mock_tv: AsyncMock, mock_movie: AsyncMock
    ) -> None:
        """Entity resolver does NOT strip bare numbers from titles like 'Blade Runner 2049'."""
        from app.services.entity_resolver import resolve

        mock_movie.return_value = {
            "results": [
                {
                    "id": 335984,
                    "title": "Blade Runner 2049",
                    "popularity": 95.0,
                    "vote_average": 8.0,
                }
            ]
        }
        mock_tv.return_value = {"results": []}
        mock_person.return_value = {"results": []}

        res = await resolve("Blade Runner 2049")
        self.assertEqual(res["id"], 335984)
        mock_movie.assert_called_once_with("Blade Runner 2049", year=None)
