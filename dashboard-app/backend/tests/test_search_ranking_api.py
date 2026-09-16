import json
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.search_ranking import import_search_rankings
def test_search_ranking_import_and_query(tmp_path):
    row={"date":"2026-09-14","rank":1,"title":"剧甲","season_id":"1","search_uv":100,"search_vv":200,"day_over_day_pct":10.5,"week_change":20.5,"content_type":"电视剧","producer_region":"韩国","genre":"KR","topic_tag":"剧情","status":"新入榜","source":"seasonSearchAuthInfo"};a=tmp_path/"a.json";b=tmp_path/"b.json";a.write_text(json.dumps({"rows":[row]}),encoding="utf-8");b.write_text(json.dumps({"rows":[{**row,"search_uv":50}]}),encoding="utf-8");url=f"sqlite:///{tmp_path/'db.sqlite3'}";assert import_search_rankings(a,b,url)==2
    with TestClient(create_app(url)) as c:r=c.get("/api/v1/search-rankings",params={"date":"2026-09-14","list_type":"新用户榜"})
    p=r.json();assert r.status_code==200;assert p["items"][0]["search_uv"]==50;assert p["meta"]["component"]=="seasonSearchAuthInfo(new_or_old=new)"
