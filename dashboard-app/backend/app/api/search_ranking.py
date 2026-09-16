from datetime import date
from typing import Literal
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import func,select
from sqlalchemy.orm import Session
from app.models import SearchRankingEntry
router=APIRouter(prefix="/api/v1",tags=["search-ranking"])
def session(request:Request):
    with request.app.state.session_factory() as s:yield s
@router.get("/search-rankings")
def rankings(data_date:date=Query(...,alias="date"),list_type:Literal["总榜","新用户榜"]="总榜",page:int=Query(1,ge=1),page_size:int=Query(15,ge=1,le=30),sort:Literal["rank","search_uv","search_vv","day_change"]="rank",direction:Literal["asc","desc"]="asc",session:Session=Depends(session)):
    filters=[SearchRankingEntry.date==data_date,SearchRankingEntry.list_type==list_type];cols={"rank":SearchRankingEntry.rank,"search_uv":SearchRankingEntry.search_uv,"search_vv":SearchRankingEntry.search_vv,"day_change":SearchRankingEntry.day_change};order=cols[sort].asc() if direction=="asc" else cols[sort].desc();total=int(session.scalar(select(func.count()).select_from(SearchRankingEntry).where(*filters)) or 0);rows=list(session.scalars(select(SearchRankingEntry).where(*filters).order_by(order,SearchRankingEntry.rank).offset((page-1)*page_size).limit(page_size)));top=list(session.scalars(select(SearchRankingEntry).where(*filters).order_by(SearchRankingEntry.search_uv.desc()).limit(10)));dates=list(session.scalars(select(SearchRankingEntry.date).where(SearchRankingEntry.list_type==list_type).distinct().order_by(SearchRankingEntry.date.desc())))
    def item(r):return {k:getattr(r,k) for k in ("rank","title","season_id","search_uv","search_vv","day_change","week_change","content_type","producer_region","genre","topic_tag","status")}
    return {"items":[item(x) for x in rows],"top10":[item(x) for x in top],"pagination":{"page":page,"page_size":page_size,"total":total},"meta":{"source":"data_provider/seasonSearchAuthInfo","component":"seasonSearchAuthInfo" if list_type=="总榜" else "seasonSearchAuthInfo(new_or_old=new)","original_fields":["search_uv","search_cnt","drama_type","plot_type","season_type"],"available_dates":[x.isoformat() for x in dates],"filters":{"date":data_date.isoformat(),"list_type":list_type,"sort":sort,"direction":direction}}}
