import json
from datetime import UTC,date,datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine,create_session_factory,default_database_url
from app.migrations import upgrade_database
from app.models import BlConsumptionEntry,BlConsumptionSummary,SyncRun
def import_bl_consumption(path:Path,database_url=None):
    data=json.loads(path.read_text(encoding="utf-8-sig"));now=datetime.now(UTC);summaries=[];entries=[]
    for row in data["summaries"]:
        start=date.fromisoformat(row["period_start"]);end=date.fromisoformat(row["period_end"]);summaries.append({"period_start":start,"period_end":end,"total_play_vv":row["total_play_vv"],"total_content_play_uv":row["total_content_play_uv"],"bl_play_vv":row["bl_play_vv"],"bl_content_play_uv":row["bl_content_play_uv"],"bl_vv_share":row["bl_vv_share"],"bl_avg_play_count":row["bl_avg_play_count"],"source":row["source"],"synced_at":now})
        for item in data["bl_top20"].get(f'{row["period_start"]}|{row["period_end"]}',[]): entries.append({"period_start":start,"period_end":end,"rank":item["rank"],"season_id":str(item["season_id"]),"title":item["title"],"season_type":item.get("season_type"),"genre":item.get("genre"),"content_type":item.get("season_classify"),"topic_tags":item.get("plot_type"),"producer_region":item.get("producer_region"),"play_vv":item["play_count"],"play_uv":item["play_uv"],"synced_at":now})
    url=database_url or default_database_url();engine=create_database_engine(url);upgrade_database(url);factory=create_session_factory(engine)
    with factory.begin() as s:
        for model,rows,keys in ((BlConsumptionSummary,summaries,["period_start","period_end"]),(BlConsumptionEntry,entries,["period_start","period_end","rank"])):
            ex=insert(model).excluded;fields=[k for k in rows[0] if k not in keys];stmt=insert(model).values(rows);s.execute(stmt.on_conflict_do_update(index_elements=keys,set_={k:getattr(ex,k) for k in fields}))
        s.add(SyncRun(dataset="bl_consumption",status="success",row_count=len(summaries)+len(entries),start_date=min(x["period_start"] for x in summaries),end_date=max(x["period_end"] for x in summaries),source="data_provider/seasonPlayVV",completed_at=now))
    engine.dispose();return {"summaries":len(summaries),"entries":len(entries)}
