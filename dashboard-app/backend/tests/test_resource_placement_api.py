import json
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.resource_placement import import_resource_snapshots

def test_resource_import_and_query(tmp_path):
    section=tmp_path/"section.json";banner=tmp_path/"banner.json";popup=tmp_path/"popup.json"
    section.write_text(json.dumps([{"date":"2026-09-15","channel":"精选","group_name":"热播","exposure_count":1000,"exposure_user":800,"click_count":120,"click_user":100,"ctr_uv":0.125}]),encoding="utf-8")
    banner.write_text(json.dumps({"rows":[{"date":"2026-09-15","clienttype_raw":"and","position_id":"首页","banner_position":"1","title":"剧甲","channel":"精选","exposure_pv":500,"exposure_uv":400,"click_pv":60,"click_uv":50,"ctr_uv":0.125}]}),encoding="utf-8")
    popup.write_text(json.dumps([{"date":"2026-09-15","id":"1","name":"弹窗甲","expost_pv":300,"expost_uv":250,"click_pv":30,"click_uv":25,"jump_pv":20,"jump_uv":18,"play_pv":12,"play_uv":10,"ctr":0.1,"conversion_rate":0.72,"play_rate":0.5556}]),encoding="utf-8")
    url=f"sqlite:///{tmp_path/'db.sqlite3'}";result=import_resource_snapshots(section,banner,popup,url);assert result=={"section":1,"banner":1,"popup":1}
    with TestClient(create_app(url)) as client:
        response=client.get("/api/v1/resource-placements",params={"resource_type":"popup","date":"2026-09-15","sort":"play_uv"})
        exported=client.get("/api/v1/resource-placements/export",params={"resource_type":"popup","date":"2026-09-15","sort":"play_uv"})
    payload=response.json();assert response.status_code==200;assert payload["items"][0]["name"]=="弹窗甲";assert payload["summary"]["play_uv"]==10;assert payload["meta"]["source"]=="data_provider/popupWindowData"
    assert exported.status_code==200;assert exported.headers["x-export-row-count"]=="1";assert "弹窗甲" in exported.content.decode("utf-8-sig")
