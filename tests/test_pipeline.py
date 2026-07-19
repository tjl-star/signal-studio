from __future__ import annotations

import csv
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import fetch_youtube


class YouTubeChainTests(unittest.TestCase):
    def test_handle_to_uploads_to_video_details(self):
        payloads = [
            {"items": [{"id": "channel-1", "snippet": {"title": "Demo"}, "statistics": {"subscriberCount": "100"}, "contentDetails": {"relatedPlaylists": {"uploads": "uploads-1"}}}]},
            {"items": [{"contentDetails": {"videoId": "video-1"}}]},
            {"items": [{"id": "video-1", "snippet": {"title": "Trailer", "publishedAt": "2026-01-01T00:00:00Z", "thumbnails": {"high": {"url": "https://example.com/image.jpg"}}}, "statistics": {"viewCount": "1000", "likeCount": "50", "commentCount": "4"}, "contentDetails": {"duration": "PT2M"}}]},
        ]
        with patch.object(fetch_youtube, "api_get", side_effect=payloads) as mocked:
            rows = fetch_youtube.fetch_channel("@Demo", 10, "secret", [], fetch_youtube.setup_logging("test"))
        self.assertEqual(mocked.call_args_list[1].args[1]["playlistId"], "uploads-1")
        self.assertEqual(mocked.call_args_list[2].args[1]["id"], "video-1")
        self.assertEqual(rows[0]["view_count"], "1000")
        self.assertEqual(rows[0]["video_url"], "https://www.youtube.com/watch?v=video-1")

    def test_playlist_pagination_collects_multiple_pages(self):
        payloads = [
            {"items": [{"id": "channel-1", "snippet": {"title": "Demo"}, "statistics": {}, "contentDetails": {"relatedPlaylists": {"uploads": "uploads-1"}}}]},
            {"items": [{"contentDetails": {"videoId": "video-1"}}], "nextPageToken": "page-2"},
            {"items": [{"contentDetails": {"videoId": "video-2"}}]},
            {"items": [
                {"id": "video-1", "snippet": {"title": "One", "publishedAt": "2026-01-01T00:00:00Z", "thumbnails": {}}, "statistics": {}, "contentDetails": {}},
                {"id": "video-2", "snippet": {"title": "Two", "publishedAt": "2026-01-02T00:00:00Z", "thumbnails": {}}, "statistics": {}, "contentDetails": {}},
            ]},
        ]
        with patch.object(fetch_youtube, "api_get", side_effect=payloads) as mocked:
            rows = fetch_youtube.fetch_channel("@Demo", 2, "secret", [], fetch_youtube.setup_logging("test"))
        self.assertEqual(len(rows), 2)
        self.assertEqual(mocked.call_args_list[2].args[1]["pageToken"], "page-2")


if __name__ == "__main__":
    unittest.main()
