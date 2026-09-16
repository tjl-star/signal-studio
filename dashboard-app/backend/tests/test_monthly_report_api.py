from pathlib import Path
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.content_ranking import import_content_ranking_snapshot
from app.sync.overview import import_overview_snapshots
from app.sync.search_ranking import import_search_rankings
def test_monthly_report_uses_final_imported_layers(tmp_path:Path):
    url=f"sqlite:///{tmp_path/'report.db'}";data=Path(__file__).resolve().parents[2]/"source-data";import_overview_snapshots(data,url);import_content_ranking_snapshot(data/"站内播放排名Top30_20260706_20260804.json",url);import_search_rankings(data/"热搜总榜_20260704_20260804.json",data/"新用户热搜_词频_20260704_20260804.json",url)
    with TestClient(create_app(url)) as client:
        response=client.get("/api/v1/monthly-report",params={"month":"2026-09","client":"安卓"});assert response.status_code==200;body=response.json();assert body["coverage"]["end"]=="2026-09-15";assert body["overview"]["latest_device_dau"]==572153;assert body["content_top"];assert body["search_top"];assert len(body["meta"]["sources"])==5
