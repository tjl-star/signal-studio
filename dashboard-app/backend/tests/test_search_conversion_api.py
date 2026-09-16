import json

from fastapi.testclient import TestClient

from app.main import create_app
from app.sync.search_conversion import import_search_conversion_snapshot


def test_search_conversion_import_and_query(tmp_path):
    source = tmp_path / "search.json"
    rows = [
        {"date": "20260914", "into_search_click_uv": 200, "search_suc_uv": 180, "search_suc_uv_ratio": "90.00%", "result_content_click_uv": 150, "result_video_after_ad_play_start_uv": 120, "result_play_5mins_uv": 60, "ff_play_uv_rate": "60.00%", "play_5min_uv_rate": "30.00%", "result_play_time_uv": 40.5},
        {"date": "20260915", "into_search_click_uv": 220, "search_suc_uv": 198, "search_suc_uv_ratio": "90.00%", "result_content_click_uv": 160, "result_video_after_ad_play_start_uv": 130, "result_play_5mins_uv": 70, "ff_play_uv_rate": "59.09%", "play_5min_uv_rate": "31.82%", "result_play_time_uv": 41.2},
    ]
    source.write_text(json.dumps({"rows": rows}), encoding="utf-8")
    database_url = f"sqlite:///{tmp_path / 'db.sqlite3'}"
    result = import_search_conversion_snapshot(source, database_url)
    assert result.inserted_or_updated == 2

    with TestClient(create_app(database_url)) as client:
        response = client.get("/api/v1/search-conversion", params={"date": "2026-09-15", "start_date": "2026-09-14", "end_date": "2026-09-15"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["current"]["into_search_click_uv"] == 220
    assert payload["previous"]["date"] == "2026-09-14"
    assert len(payload["trend"]) == 2
    assert payload["current"]["play_5min_uv_rate"] == 0.3182
    assert payload["meta"]["component"] == "search_drama_conversion_data"
