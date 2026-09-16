from pathlib import Path
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.bl_consumption import import_bl_consumption
def test_bl_consumption_returns_real_top20(tmp_path:Path):
    url=f"sqlite:///{tmp_path/'bl.db'}";source=Path(__file__).resolve().parents[2]/"source-data"/"content_growth_tabs.json";result=import_bl_consumption(source,url);assert result["summaries"]==15;assert result["entries"]>0
    with TestClient(create_app(url)) as client:
        response=client.get("/api/v1/bl-consumption");assert response.status_code==200;body=response.json();assert len(body["items"])==20;assert body["summary"]["period_end"]=="2026-09-15";assert body["items"][0]["title"]=="请记住我的名字";assert body["meta"]["component"]=="seasonPlayVV"
