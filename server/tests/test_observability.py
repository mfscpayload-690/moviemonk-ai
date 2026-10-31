"""Unit tests for the client observability ingestion endpoint (/api/observability)."""

from __future__ import annotations

import json
import unittest
from typing import Any

from fastapi.testclient import TestClient

from app.api.observability import _sanitize_value
from app.main import create_app


class ObservabilityEndpointTests(unittest.TestCase):
    app: Any
    client: TestClient

    @classmethod
    def setUpClass(cls) -> None:
        cls.app = create_app()
        cls.client = TestClient(cls.app)

    def test_observability_get_status(self) -> None:
        """GET /api/observability returns 200 OK with service identifier."""
        response = self.client.get("/api/observability")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("service"), "observability")

    def test_ingest_single_info_event(self) -> None:
        """POST /api/observability ingests standard client session event."""
        payload = {
            "ts": "2026-10-30T15:00:00.000Z",
            "source": "client",
            "event": "client_session_start",
            "level": "info",
            "data": {"user_agent": "TestBrowser/1.0", "screen": "1920x1080"},
        }
        response = self.client.post("/api/observability", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("ingested"), 1)

    def test_ingest_client_error_event(self) -> None:
        """POST /api/observability ingests error report matching emitClientError."""
        payload = {
            "ts": "2026-10-30T15:01:00.000Z",
            "source": "client",
            "event": "client_error",
            "level": "error",
            "data": {
                "message": "Failed to fetch movie details",
                "service": "tmdbService",
                "context": "getMovieDetails",
            },
        }
        response = self.client.post("/api/observability", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("ingested"), 1)

    def test_ingest_batch_events(self) -> None:
        """POST /api/observability supports array of events."""
        payload = [
            {"event": "web_vital_lcp", "level": "info", "data": {"value": 1200}},
            {"event": "web_vital_cls", "level": "info", "data": {"value": 0.02}},
        ]
        response = self.client.post("/api/observability", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("ingested"), 2)

    def test_ingest_text_plain_beacon(self) -> None:
        """POST /api/observability accepts payload sent via navigator.sendBeacon."""
        payload = json.dumps({
            "event": "beacon_unload",
            "level": "info",
            "data": {"time_spent_ms": 45000},
        })
        response = self.client.post(
            "/api/observability",
            content=payload.encode("utf-8"),
            headers={"Content-Type": "text/plain;charset=UTF-8"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("ingested"), 1)

    def test_reject_empty_payload(self) -> None:
        """POST /api/observability rejects empty body with 400 Bad Request."""
        response = self.client.post(
            "/api/observability",
            content=b"",
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get("ok"))
        self.assertEqual(data.get("error", {}).get("code"), "empty_payload")

    def test_reject_invalid_json(self) -> None:
        """POST /api/observability rejects malformed JSON with 400 Bad Request."""
        response = self.client.post(
            "/api/observability",
            content=b"{malformed_json: true",
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get("ok"))
        self.assertEqual(data.get("error", {}).get("code"), "invalid_json")

    def test_reject_payload_too_large(self) -> None:
        """POST /api/observability rejects bodies exceeding 64 KB limit."""
        huge_string = "A" * 70000
        payload = {"event": "large_event", "data": {"bloat": huge_string}}
        raw_bytes = json.dumps(payload).encode("utf-8")
        response = self.client.post(
            "/api/observability",
            content=raw_bytes,
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 413)
        data = response.json()
        self.assertFalse(data.get("ok"))
        self.assertEqual(data.get("error", {}).get("code"), "payload_too_large")

    def test_reject_streamed_payload_too_large(self) -> None:
        """POST /api/observability incrementally streams body and rejects when exceeding limit."""
        def generate_large_stream():
            for _ in range(70):
                yield b"A" * 1024

        response = self.client.post(
            "/api/observability",
            content=generate_large_stream(),
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 413)
        data = response.json()
        self.assertFalse(data.get("ok"))
        self.assertEqual(data.get("error", {}).get("code"), "payload_too_large")

    def test_sanitization_masks_sensitive_credentials(self) -> None:
        """Data sanitization replaces sensitive keys and tokens with redaction masks."""
        raw_data = {
            "api_key": "secret123456",
            "supabase_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMC6Y5",
            "auth_header": "sensitive_auth_value",
            "error_detail": "Failed request with header Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN7s",
            "request_log": "Proxy rejected with Basic dXNlcjpwYXNz",
            "normal_key": "safe_value",
            "nested": {
                "password": "hunter2",
                "message": "Failed with token=XYZ",
            },
        }
        sanitized = _sanitize_value(raw_data)
        self.assertEqual(sanitized["api_key"], "[REDACTED]")
        self.assertEqual(sanitized["supabase_token"], "[REDACTED]")
        self.assertEqual(sanitized["auth_header"], "[REDACTED]")
        self.assertIn("Bearer [REDACTED]", sanitized["error_detail"])
        self.assertIn("Basic [REDACTED]", sanitized["request_log"])
        self.assertEqual(sanitized["normal_key"], "safe_value")
        self.assertEqual(sanitized["nested"]["password"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["message"], "Failed with token=[REDACTED]")

    def test_log_injection_characters_rejected_safely(self) -> None:
        """Event names containing control characters (CRLF) are skipped without crashing."""
        malicious_payload = {
            "event": "normal_event\r\nINJECTED LOG LINE",
            "level": "error",
            "data": {},
        }
        response = self.client.post("/api/observability", json=malicious_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Invalid event name is safely skipped
        self.assertEqual(data.get("ingested"), 0)

    def test_validation_error_does_not_leak_inputs_in_logs(self) -> None:
        """Validation errors log locations and error types without echoing raw input."""
        with self.assertLogs("moviemonk.client", level="WARNING") as cm:
            invalid_payload = {
                "event": "normal_event\r\nINJECTED",
                "data": {"api_key": "super_secret_value"},
            }
            self.client.post("/api/observability", json=invalid_payload)
            log_output = " ".join(cm.output)
            self.assertNotIn("super_secret_value", log_output)
            self.assertNotIn("INJECTED", log_output)


if __name__ == "__main__":
    unittest.main()
