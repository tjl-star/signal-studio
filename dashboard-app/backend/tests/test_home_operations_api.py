import json
from fastapi.testclient import TestClient
from app.main import create_app
from app.sync.home_operations import import_home_operations
def test_home_operations_import_and_query(tmp_path):
    f=tmp_path/"f.json";g=tmp_path/"g.json";f.write_text(json.dumps({"rows":[{"日期":"2026-08-04","频道名称":"精选","首页进入频道页UV":100,"频道页内容点击UV":50,"详情播放UV":40,"播放超过5分钟UV":20,"有效播放UV":18,"首页进入→频道点击转化率":.5,"频道点击→详情播放转化率":.8,"详情播放→5分钟有效播放转化率":.5,"5分钟有效播放→有效播放转化率":.9}]}),encoding="utf-8");g.write_text(json.dumps({"rows":[{"date":"20260804","page":"首页","source_type":"猜你喜欢","front_tab_uv":200,"total_content_exposure_uv":100,"total_content_click_uv":30,"total_content_click_rate":"30%","ff_play_convert_rate":"20%","play_convert_rate":"90%","play_5min_rate_uv":"10%","avg_time_uv":25.5}]}),encoding="utf-8");url=f"sqlite:///{tmp_path/'db.sqlite3'}";assert import_home_operations(f,g,url)=={"channel":1,"recommendation":1}
    with TestClient(create_app(url)) as c:r=c.get("/api/v1/home-operations",params={"date":"2026-08-04","start_date":"2026-08-04","end_date":"2026-08-04"})
    p=r.json();assert r.status_code==200;assert p["channels"][0]["entry_uv"]==100;assert p["recommendation"]["content_click_rate"]==.3;assert p["meta"]["recommendation"]["page"]=="首页"
