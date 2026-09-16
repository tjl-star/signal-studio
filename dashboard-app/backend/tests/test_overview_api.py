from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import create_app
from app.sync.overview import import_overview_snapshots


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def test_overview_import_and_query_through_public_interfaces(tmp_path):
    source = tmp_path / "snapshots"
    source.mkdir()
    write_json(
        source / "new_people_video_daily_active.json",
        {
            "source": "data-provider /skill/coreData",
            "rows": [
                {
                    "date": "2026-09-15",
                    "client": "安卓",
                    "device_dau": 1200,
                    "new_device": 180,
                    "play_rate": 0.72,
                },
                {
                    "date": "2026-09-14",
                    "client": "安卓",
                    "device_dau": 1000,
                    "new_device": 150,
                    "play_rate": 0.7,
                },
            ],
        },
    )
    write_json(
        source / "播放率_近30天_按客户端.json",
        {
            "source": "data_provider /skill/coreData",
            "rows": [
                {"date": "2026-09-15", "client_type": "安卓", "play_rate": 0.72},
                {"date": "2026-09-14", "client_type": "安卓", "play_rate": 0.7},
            ],
        },
    )
    write_json(
        source / "人均播放时长_近30天_按客户端.json",
        [
            {"date": "2026-09-15", "client_type": "安卓", "total_avg_watch_duration": 66.5},
            {"date": "2026-09-14", "client_type": "安卓", "total_avg_watch_duration": 64.0},
        ],
    )
    write_json(
        source / "avg_play_count_by_client.json",
        [
            {"日期": "2026-09-15", "安卓": 7.8, "iOS": 8.1, "M站": 4.0, "全部": 7.3},
            {"日期": "2026-09-14", "安卓": 7.5, "iOS": 7.9, "M站": 3.9, "全部": 7.1},
            {"date": "2026-09-13", "total_avg_play_count": 6.9},
        ],
    )
    database_url = f"sqlite:///{tmp_path / 'signal-studio.db'}"

    result = import_overview_snapshots(source, database_url=database_url)

    assert result.inserted_or_updated == 9
    assert result.start_date == "2026-09-13"
    assert result.end_date == "2026-09-15"

    app = create_app(database_url=database_url)
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/overview",
            params={"start_date": "2026-09-14", "end_date": "2026-09-15", "client": "安卓"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"] == {
        "device_dau": 1200,
        "new_device": 180,
        "play_rate": 0.72,
        "avg_watch_duration": 66.5,
        "avg_play_count": 7.8,
    }
    assert payload["comparison"]["device_dau"] == 0.2
    assert [row["date"] for row in payload["trend"]] == ["2026-09-14", "2026-09-15"]
    assert payload["meta"]["source"] == "data_provider/coreData"
    assert payload["meta"]["filters"]["client"] == "安卓"
    assert payload["meta"]["data_status"] == "snapshot"
    assert [row["client"] for row in payload["client_breakdown"]] == ["安卓", "iOS", "M站"]
    assert payload["client_breakdown"][0] == {
        "date": "2026-09-15",
        "client": "安卓",
        "device_dau": 1200,
        "new_device": 180,
        "play_rate": 0.72,
        "avg_watch_duration": 66.5,
        "avg_play_count": 7.8,
    }
    assert payload["client_breakdown"][1]["avg_play_count"] == 8.1
    assert payload["meta"]["client_breakdown_scope"].startswith("安卓 / iOS / M站")

    with TestClient(app) as client:
        all_client_response = client.get(
            "/api/v1/overview",
            params={"start_date": "2026-09-13", "end_date": "2026-09-13", "client": "全部"},
        )
    assert all_client_response.json()["summary"]["avg_play_count"] == 6.9
