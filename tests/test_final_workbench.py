from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from api import app
from content_classifier import classify_content


class ContentClassifierTests(unittest.TestCase):
    def test_trailer_rule_is_explainable(self):
        result = classify_content({"title": "Official Trailer | New Series", "duration": "PT2M10S"})
        self.assertEqual(result["content_type"], "trailer")
        self.assertIn("keyword", result["classification_method"])
        self.assertGreaterEqual(result["classification_confidence"], 0.8)

    def test_short_duration_is_classified(self):
        result = classify_content({"title": "A quick character moment", "duration": "PT42S"})
        self.assertEqual(result["content_type"], "short")


class FinalApiSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_core_read_endpoints(self):
        for path in ("/api/health", "/api/overview", "/api/videos?limit=5", "/api/channels", "/api/titles", "/api/runs"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            payload = response.json()
            self.assertEqual(payload["code"], 0, path)

    def test_video_filters_and_detail(self):
        listing = self.client.get("/api/videos?content_type=trailer&limit=5").json()["data"]
        if listing["count"] == 0:
            self.skipTest("No local database fixture; run the import pipeline for data-backed API assertions.")
        self.assertGreater(listing["count"], 0)
        item = listing["items"][0]
        self.assertEqual(item["content_type"], "trailer")
        detail = self.client.get(f"/api/videos/{item['platform']}/{item['video_id']}")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("metric_history", detail.json()["data"])

    def test_local_exports(self):
        for path in ("/api/exports/videos.csv", "/api/exports/recommendations.csv", "/api/exports/report.md"):
            self.assertEqual(self.client.get(path).status_code, 200, path)


if __name__ == "__main__":
    unittest.main()
