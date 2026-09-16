from datetime import date
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import BlConsumptionEntry,BlConsumptionSummary
router=APIRouter(prefix="/api/v1",tags=["bl-consumption"])
def session(request:Request):
    with request.app.state.session_factory() as s:yield s
@router.get("/bl-consumption")
def bl(period_end:date|None=Query(None),sort:str=Query("rank",pattern="^(rank|play_vv|play_uv)$"),session:Session=Depends(session)):
    periods=list(session.scalars(select(BlConsumptionSummary).order_by(BlConsumptionSummary.period_end.desc(),BlConsumptionSummary.period_start.desc())))
    chosen=next((x for x in periods if x.period_end==period_end),periods[0] if periods else None)
    if not chosen:return {"summary":None,"items":[],"periods":[],"meta":{"status":"empty"}}
    col={"rank":BlConsumptionEntry.rank,"play_vv":BlConsumptionEntry.play_vv,"play_uv":BlConsumptionEntry.play_uv}[sort];order=col.asc() if sort=="rank" else col.desc();rows=list(session.scalars(select(BlConsumptionEntry).where(BlConsumptionEntry.period_start==chosen.period_start,BlConsumptionEntry.period_end==chosen.period_end).order_by(order)))
    item=lambda r:{k:getattr(r,k) for k in ("rank","season_id","title","genre","content_type","topic_tags","producer_region","play_vv","play_uv")}|{"avg_play_count":r.play_vv/r.play_uv if r.play_uv else None}
    return {"summary":{k:getattr(chosen,k) for k in ("period_start","period_end","total_play_vv","total_content_play_uv","bl_play_vv","bl_content_play_uv","bl_vv_share","bl_avg_play_count")},"items":[item(x) for x in rows],"periods":[{"start":x.period_start,"end":x.period_end} for x in periods],"meta":{"source":"data_provider/seasonPlayVV","component":"seasonPlayVV","original_fields":["play_count","play_uv","plot_type","season_type","season_classify","producer_region"],"rule":"plot_type 包含精确标签 同性","limitation":"内容级播放UV跨内容求和不等于全站去重用户UV"}}
