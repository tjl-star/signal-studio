from __future__ import annotations

import csv
import sys
import unittest
import shutil
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from database import connect, finish_run, init_db, start_run, upsert_dataset


class DatabaseHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = ROOT / "tests" / ".tmp" / uuid.uuid4().hex
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.temp_dir / "monitor.db"
        init_db(self.db_path)
        self.row = {
            "platform": "youtube", "channel_id": "channel-1", "channel_handle": "@Demo",
            "channel_title": "Demo", "subscriber_count": "100", "video_id": "video-1",
            "video_url": "https://www.youtube.com/watch?v=video-1", "title": "Trailer",
            "description": "", "tags": "", "published_at": "2026-01-01T00:00:00Z",
            "duration": "PT1M", "thumbnail_url": "https://example.com/1.jpg",
            "fetched_at": "2026-01-02T00:00:00Z", "view_count": "1000", "like_count": "50",
            "comment_count": "5", "heat_score": "60", "recommendation": "follow",
        }

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_repeated_upsert_keeps_one_video_and_adds_metric_history(self):
        run1 = start_run(1, self.db_path)
        stats1 = upsert_dataset([self.row], run1, self.db_path)
        finish_run(run1, "success", {**stats1, "successful_channels": 1}, path=self.db_path)
        updated = {**self.row, "view_count": "1200", "fetched_at": "2026-01-03T00:00:00Z"}
        run2 = start_run(1, self.db_path)
        stats2 = upsert_dataset([updated], run2, self.db_path)
        finish_run(run2, "success", {**stats2, "successful_channels": 1}, path=self.db_path)
        with connect(self.db_path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM videos").fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM video_metrics").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT latest_view_count FROM videos").fetchone()[0], 1200)
        self.assertEqual(stats1["videos_inserted"], 1)
        self.assertEqual(stats2["videos_updated"], 1)

    def test_same_run_metric_is_idempotent(self):
        run_id = start_run(1, self.db_path)
        first = upsert_dataset([self.row], run_id, self.db_path)
        second = upsert_dataset([self.row], run_id, self.db_path)
        self.assertEqual(first["metrics_inserted"], 1)
        self.assertEqual(second["metrics_inserted"], 0)


if __name__ == "__main__":
    unittest.main()
