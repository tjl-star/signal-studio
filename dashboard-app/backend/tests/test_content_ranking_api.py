from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import create_app
from app.sync.content_ranking import import_content_ranking_snapshot


def test_content_ranking_import_and_server_pagination(tmp_path):
    source = tmp_path / "ranking.json"
    rows = [
        {
            "日期": "2026-09-15",
            "榜单分类": "总榜",
            "排名": rank,
            "内容名称": title,
            "season_id": season_id,
            "播放UV": uv,
            "播放VV": vv,
            "昨日环比": change,
            "周环比": "↑1.00%",
            "聚集类型": "TH",
            "内容分类": "电视剧",
            "题材标签": "剧情,爱情",
            "榜单状态": "--",
            "数据状态": "真实Top30",
            "来源接口": "seasonPlayVV",
            "限制说明": "测试口径",
        }
        for rank, title, season_id, uv, vv, change in (
            (1, "内容甲", "101", 100, 300, "↓10.00%"),
            (2, "内容乙", "102", 90, 500, "↑20.00%"),
            (3, "内容丙", "103", 80, 400, "↑5.00%"),
        )
    ]
    rows.append({**rows[0], "榜单分类": "新用户榜", "来源接口": "playTop10"})
    source.write_text(json.dumps({"rows": rows}, ensure_ascii=False), encoding="utf-8")
    database_url = f"sqlite:///{tmp_path / 'signal-studio.db'}"

    result = import_content_ranking_snapshot(source, database_url)

    assert result.inserted_or_updated == 4
    assert result.start_date == "2026-09-15"
    assert result.list_types == ("总榜", "新用户榜")

    app = create_app(database_url=database_url)
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/content-rankings",
            params={
                "date": "2026-09-15",
                "list_type": "总榜",
                "page": 1,
                "page_size": 2,
                "sort": "play_vv",
                "direction": "desc",
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert [item["title"] for item in payload["items"]] == ["内容乙", "内容丙"]
    assert [item["title"] for item in payload["top10"]] == ["内容乙", "内容丙", "内容甲"]
    assert payload["pagination"] == {"page": 1, "page_size": 2, "total": 3}
    assert payload["items"][0]["day_change_rate"] == 0.2
    assert payload["meta"]["component"] == "seasonPlayVV"
    assert payload["meta"]["available_dates"] == ["2026-09-15"]
    assert payload["meta"]["unsupported_list_types"] == ["新增用户榜"]
