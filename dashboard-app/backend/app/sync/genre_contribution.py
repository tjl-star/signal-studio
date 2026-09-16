import json
from datetime import UTC,date,datetime
from pathlib import Path
from sqlalchemy.dialects.sqlite import insert
from app.database import create_database_engine,create_session_factory,default_database_url
from app.migrations import upgrade_database
from app.models import GenreContributionEntry,GenreContributionSummary,SyncRun
def import_genre_contribution(path:Path,database_url=None):
    data=json.loads(path.read_text(encoding="utf-8-sig"));now=datetime.now(UTC);summaries=[];entries=[]
    for view in data["genre_top30"].values():
        start=date.fromisoformat(view["period_start"]);end=date.fromisoformat(view["period_end"]);code=view["genre_code"];summaries.append({"period_start":start,"period_end":end,"genre_code":code,"genre":view["genre"],"total_play_vv":view["total_play_vv"],"total_play_uv":view["total_play_uv"],"top1_contribution":view.get("top1_contribution"),"top5_contribution":view.get("top5_contribution"),"synced_at":now});mapped={}
        for metric,key in (("rank_vv","top30_vv"),("rank_uv","top30_uv")):
            for row in view.get(key,[]):
                item=mapped.setdefault(str(row["season_id"]),{"period_start":start,"period_end":end,"genre_code":code,"season_id":str(row["season_id"]),"title":row["title"],"rank_vv":None,"rank_uv":None,"play_vv":row["play_count"],"play_uv":row["play_uv"],"content_type":row.get("season_classify"),"topic_tags":row.get("plot_type"),"producer_region":row.get("producer_region"),"synced_at":now});item[metric]=row["rank"]
        entries.extend(mapped.values())
    url=database_url or default_database_url();engine=create_database_engine(url);upgrade_database(url);factory=create_session_factory(engine)
    with factory.begin() as s:
        for model,rows,keys in ((GenreContributionSummary,summaries,["period_start","period_end","genre_code"]),(GenreContributionEntry,entries,["period_start","period_end","genre_code","season_id"])):
            ex=insert(model).excluded;fields=[k for k in rows[0] if k not in keys]
            for i in range(0,len(rows),150):stmt=insert(model).values(rows[i:i+150]);s.execute(stmt.on_conflict_do_update(index_elements=keys,set_={k:getattr(ex,k) for k in fields}))
        s.add(SyncRun(dataset="genre_contribution",status="success",row_count=len(summaries)+len(entries),start_date=min(x["period_start"] for x in summaries),end_date=max(x["period_end"] for x in summaries),source="data_provider/seasonPlayVV",completed_at=now))
    engine.dispose();return {"summaries":len(summaries),"entries":len(entries)}
