import json
from datetime import UTC,date,datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine,create_session_factory,default_database_url
from app.migrations import upgrade_database
from app.models import PlaybackGrowthEntry,SyncRun
def import_playback_growth(path:Path,database_url=None):
    data=json.loads(path.read_text(encoding="utf-8-sig"));now=datetime.now(UTC);rows=[]
    for values in data["growth_by_period"].values():
        for r in values:
            previous=int(r.get("previous_play_vv") or 0);feature="start" if previous<1000 else "burst" if r["play_count"]>previous and (r["play_count"]-previous)/previous>=1 else "stable";rows.append({"period_start":date.fromisoformat(r["period_start"]),"period_end":date.fromisoformat(r["period_end"]),"season_id":str(r["season_id"]),"title":r["title"],"genre":r.get("genre"),"content_type":r.get("season_classify"),"topic_tags":r.get("plot_type"),"producer_region":r.get("producer_region"),"play_vv":r["play_count"],"play_uv":r["play_uv"],"current_rank":r.get("rank"),"previous_play_vv":previous,"vv_delta":r["vv_delta"],"vv_change_rate":r.get("vv_mom"),"previous_rank":r.get("previous_rank"),"new_top20":int(bool(r.get("new_top20"))),"continuous_growth":int(bool(r.get("continuous_growth"))),"growth_feature":feature,"synced_at":now})
    url=database_url or default_database_url();engine=create_database_engine(url);upgrade_database(url);factory=create_session_factory(engine);ex=insert(PlaybackGrowthEntry).excluded;keys=["period_start","period_end","season_id"];fields=[k for k in rows[0] if k not in keys]
    with factory.begin() as s:
        for i in range(0,len(rows),150):stmt=insert(PlaybackGrowthEntry).values(rows[i:i+150]);s.execute(stmt.on_conflict_do_update(index_elements=keys,set_={k:getattr(ex,k) for k in fields}))
        s.add(SyncRun(dataset="playback_growth",status="success",row_count=len(rows),start_date=min(x["period_start"] for x in rows),end_date=max(x["period_end"] for x in rows),source="data_provider/seasonPlayVV",completed_at=now))
    engine.dispose();return len(rows)
