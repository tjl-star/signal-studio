from datetime import date,timedelta
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import PlaybackGrowthEntry
router=APIRouter(prefix="/api/v1",tags=["playback-growth"])
def session(request:Request):
    with request.app.state.session_factory() as s:yield s
@router.get("/playback-growth")
def growth(period_end:date|None=Query(None),status:str=Query("all",pattern="^(all|new|continuous)$"),feature:str=Query("all",pattern="^(all|start|burst|stable)$"),session:Session=Depends(session)):
    periods=list(session.execute(select(PlaybackGrowthEntry.period_start,PlaybackGrowthEntry.period_end).distinct().order_by(PlaybackGrowthEntry.period_end.desc(),PlaybackGrowthEntry.period_start.desc())).all());end=period_end or (periods[0].period_end if periods else None);chosen=next((x for x in periods if x.period_end==end),periods[0] if periods else None)
    if not chosen:return {"items":[],"period":None,"periods":[],"summary":{},"meta":{"status":"empty"}}
    q=select(PlaybackGrowthEntry).where(PlaybackGrowthEntry.period_start==chosen.period_start,PlaybackGrowthEntry.period_end==chosen.period_end)
    if status=="new":q=q.where(PlaybackGrowthEntry.new_top20==1)
    elif status=="continuous":q=q.where(PlaybackGrowthEntry.continuous_growth==1)
    if feature!="all":q=q.where(PlaybackGrowthEntry.growth_feature==feature)
    rows=list(session.scalars(q.order_by(PlaybackGrowthEntry.vv_delta.desc())));days=(chosen.period_end-chosen.period_start).days+1;previous_end=chosen.period_start-timedelta(days=1);previous_start=previous_end-timedelta(days=days-1)
    item=lambda x:{k:getattr(x,k) for k in ("season_id","title","genre","content_type","topic_tags","producer_region","play_vv","play_uv","current_rank","previous_play_vv","vv_delta","vv_change_rate","previous_rank","growth_feature")}|{"new_top20":bool(x.new_top20),"continuous_growth":bool(x.continuous_growth)}
    return {"items":[item(x) for x in rows],"period":{"start":chosen.period_start,"end":chosen.period_end,"previous_start":previous_start,"previous_end":previous_end},"periods":[{"start":x.period_start,"end":x.period_end} for x in periods],"summary":{"count":len(rows),"total_delta":sum(x.vv_delta for x in rows),"new_count":sum(x.new_top20 for x in rows),"burst_count":sum(x.growth_feature=="burst" for x in rows)},"meta":{"source":"data_provider/seasonPlayVV","component":"seasonPlayVV","original_fields":["play_count","play_uv","season_type","season_classify","plot_type","producer_region"],"formula":"播放VV增量 = 当前周期播放VV - 上一等长周期播放VV","filters":{"status":status,"feature":feature}}}
