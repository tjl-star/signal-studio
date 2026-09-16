from pathlib import Path
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.playback_growth import import_playback_growth
def test_playback_growth_returns_equal_period_comparison(tmp_path:Path):
    url=f"sqlite:///{tmp_path/'growth.db'}";source=Path(__file__).resolve().parents[2]/"source-data"/"content_growth_tabs.json";count=import_playback_growth(source,url);assert count>200
    with TestClient(create_app(url)) as client:
        body=client.get("/api/v1/playback-growth").json();assert body["period"]["end"]=="2026-09-15";assert body["period"]["previous_start"]=="2026-09-02";assert body["period"]["previous_end"]=="2026-09-08";assert body["items"][0]["title"]=="My Dearest";assert body["items"][0]["vv_delta"]==558968;assert body["meta"]["component"]=="seasonPlayVV"
