from pathlib import Path
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.genre_contribution import import_genre_contribution
def test_genre_contribution_returns_real_top30(tmp_path:Path):
    url=f"sqlite:///{tmp_path/'genre.db'}";source=Path(__file__).resolve().parents[2]/"source-data"/"content_growth_tabs.json";result=import_genre_contribution(source,url);assert result["summaries"]==105;assert result["entries"]>3000
    with TestClient(create_app(url)) as client:
        body=client.get("/api/v1/genre-contribution",params={"genre_code":"TH"}).json();assert body["summary"]["period_end"]=="2026-09-15";assert body["summary"]["genre"]=="泰剧";assert len(body["items"])==30;assert len(body["distribution"])==7;assert body["meta"]["component"]=="seasonPlayVV"
