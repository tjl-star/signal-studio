from datetime import date
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import GenreContributionEntry,GenreContributionSummary
router=APIRouter(prefix="/api/v1",tags=["genre-contribution"])
def session(request:Request):
    with request.app.state.session_factory() as s:yield s
@router.get("/genre-contribution")
def contribution(period_end:date|None=Query(None),genre_code:str="TH",metric:str=Query("play_vv",pattern="^(play_vv|play_uv)$"),session:Session=Depends(session)):
    periods=list(session.execute(select(GenreContributionSummary.period_start,GenreContributionSummary.period_end).distinct().order_by(GenreContributionSummary.period_end.desc())).all());end=period_end or (periods[0].period_end if periods else None);summaries=list(session.scalars(select(GenreContributionSummary).where(GenreContributionSummary.period_end==end).order_by(GenreContributionSummary.total_play_vv.desc())));chosen=next((x for x in summaries if x.genre_code==genre_code),summaries[0] if summaries else None)
    if not chosen:return {"summary":None,"distribution":[],"items":[],"periods":[],"meta":{"status":"empty"}}
    rank=GenreContributionEntry.rank_vv if metric=="play_vv" else GenreContributionEntry.rank_uv;rows=list(session.scalars(select(GenreContributionEntry).where(GenreContributionEntry.period_start==chosen.period_start,GenreContributionEntry.period_end==chosen.period_end,GenreContributionEntry.genre_code==chosen.genre_code,rank.is_not(None)).order_by(rank).limit(30)))
    total=sum(x.total_play_vv for x in summaries);return {"summary":{k:getattr(chosen,k) for k in ("period_start","period_end","genre_code","genre","total_play_vv","total_play_uv","top1_contribution","top5_contribution")}|{"share":chosen.total_play_vv/total if total else None},"distribution":[{"genre_code":x.genre_code,"genre":x.genre,"play_vv":x.total_play_vv,"share":x.total_play_vv/total if total else None} for x in summaries],"items":[{"rank":getattr(x,"rank_vv" if metric=="play_vv" else "rank_uv"),"season_id":x.season_id,"title":x.title,"play_vv":x.play_vv,"play_uv":x.play_uv,"contribution":x.play_vv/chosen.total_play_vv if chosen.total_play_vv else None,"content_type":x.content_type,"topic_tags":x.topic_tags,"producer_region":x.producer_region} for x in rows],"periods":[{"start":x.period_start,"end":x.period_end} for x in periods],"meta":{"source":"data_provider/seasonPlayVV","component":"seasonPlayVV","original_fields":["play_count","play_uv","season_type","season_classify","plot_type","producer_region"],"limitation":"播放UV为内容维度，跨内容相加不等于全站去重用户UV","metric":metric}}
