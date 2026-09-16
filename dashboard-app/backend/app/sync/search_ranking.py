import json
from datetime import UTC,date,datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine,create_session_factory,default_database_url
from app.migrations import upgrade_database
from app.models import SearchRankingEntry,SyncRun
def import_search_rankings(total_file:Path,new_file:Path,database_url=None):
    now=datetime.now(UTC);records=[]
    for kind,path in (("总榜",total_file),("新用户榜",new_file)):
        for r in json.loads(path.read_text(encoding="utf-8-sig"))["rows"]:
            records.append({"date":date.fromisoformat(r["date"]),"list_type":kind,"rank":int(r["rank"]),"title":r["title"],"season_id":str(r.get("season_id") or "") or None,"search_uv":int(r["search_uv"]) if r.get("search_uv") is not None else None,"search_vv":int(r["search_vv"]) if r.get("search_vv") is not None else None,"day_change":r.get("day_over_day_pct"),"week_change":r.get("week_change"),"content_type":r.get("content_type"),"producer_region":r.get("producer_region"),"genre":r.get("genre"),"topic_tag":r.get("topic_tag"),"status":r.get("status"),"source":r.get("source") or "seasonSearchAuthInfo","synced_at":now})
    url=database_url or default_database_url();engine=create_database_engine(url);upgrade_database(url);factory=create_session_factory(engine);ex=insert(SearchRankingEntry).excluded;fields=[k for k in records[0] if k not in {"date","list_type","rank"}]
    with factory.begin() as s:
        for i in range(0,len(records),150):
            stmt=insert(SearchRankingEntry).values(records[i:i+150]);s.execute(stmt.on_conflict_do_update(index_elements=["date","list_type","rank"],set_={k:getattr(ex,k) for k in fields}))
        s.add(SyncRun(dataset="search_ranking",status="success",row_count=len(records),start_date=min(x["date"] for x in records),end_date=max(x["date"] for x in records),source="data_provider/seasonSearchAuthInfo",completed_at=now))
    engine.dispose();return len(records)
