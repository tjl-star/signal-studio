import json
from datetime import UTC,date,datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine,create_session_factory,default_database_url
from app.migrations import upgrade_database
from app.models import HomeChannelMetric,RecommendationMetric,SyncRun
def rate(v): return None if v in (None,"") else float(str(v).removesuffix("%"))/(100 if isinstance(v,str) and "%" in v else 1)
def import_home_operations(funnel_file:Path,guess_file:Path,database_url=None):
    f=json.loads(funnel_file.read_text(encoding="utf-8-sig"))["rows"];g=json.loads(guess_file.read_text(encoding="utf-8-sig"))["rows"];now=datetime.now(UTC)
    fr=[{"date":date.fromisoformat(r["日期"]),"channel":r["频道名称"],"entry_uv":r["首页进入频道页UV"],"content_click_uv":r["频道页内容点击UV"],"detail_play_uv":r["详情播放UV"],"play_5m_uv":r["播放超过5分钟UV"],"effective_play_uv":r["有效播放UV"],"entry_click_rate":r["首页进入→频道点击转化率"],"click_play_rate":r["频道点击→详情播放转化率"],"detail_5m_rate":r["详情播放→5分钟有效播放转化率"],"play_5m_effective_rate":r["5分钟有效播放→有效播放转化率"],"synced_at":now} for r in f]
    gr=[{"date":datetime.strptime(r["date"],"%Y%m%d").date(),"page":r["page"],"source_type":r["source_type"],"front_tab_uv":r.get("front_tab_uv"),"content_exposure_uv":r.get("total_content_exposure_uv"),"content_click_uv":r.get("total_content_click_uv"),"content_click_rate":rate(r.get("total_content_click_rate")),"ff_play_convert_rate":rate(r.get("ff_play_convert_rate")),"play_convert_rate":rate(r.get("play_convert_rate")),"play_5min_rate_uv":rate(r.get("play_5min_rate_uv")),"avg_time_uv":r.get("avg_time_uv"),"synced_at":now} for r in g]
    url=database_url or default_database_url();engine=create_database_engine(url);upgrade_database(url);factory=create_session_factory(engine)
    with factory.begin() as s:
        for model,records,keys in ((HomeChannelMetric,fr,["date","channel"]),(RecommendationMetric,gr,["date"])):
            ex=insert(model).excluded;fields=[k for k in records[0] if k not in keys];stmt=insert(model).values(records);s.execute(stmt.on_conflict_do_update(index_elements=keys,set_={k:getattr(ex,k) for k in fields}))
        s.add_all([SyncRun(dataset="home_channel",status="success",row_count=len(fr),start_date=min(x["date"] for x in fr),end_date=max(x["date"] for x in fr),source="data_provider/dramaConversion",completed_at=now),SyncRun(dataset="recommendation",status="success",row_count=len(gr),start_date=min(x["date"] for x in gr),end_date=max(x["date"] for x in gr),source="Quick BI MCP/recommend_data",completed_at=now)])
    engine.dispose();return {"channel":len(fr),"recommendation":len(gr)}
