from datetime import date
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import HomeChannelMetric,RecommendationMetric
router=APIRouter(prefix="/api/v1",tags=["home-operations"])
def session(request:Request):
    with request.app.state.session_factory() as s: yield s
def row(r,fields): return {"date":r.date.isoformat(),**{f:getattr(r,f) for f in fields}}
@router.get("/home-operations")
def home_operations(data_date:date=Query(...,alias="date"),start_date:date=Query(...),end_date:date=Query(...),session:Session=Depends(session)):
    cf=["channel","entry_uv","content_click_uv","detail_play_uv","play_5m_uv","effective_play_uv","entry_click_rate","click_play_rate","detail_5m_rate","play_5m_effective_rate"]
    gf=["page","source_type","front_tab_uv","content_exposure_uv","content_click_uv","content_click_rate","ff_play_convert_rate","play_convert_rate","play_5min_rate_uv","avg_time_uv"]
    channels=list(session.scalars(select(HomeChannelMetric).where(HomeChannelMetric.date==data_date).order_by(HomeChannelMetric.entry_uv.desc())))
    guess=session.scalar(select(RecommendationMetric).where(RecommendationMetric.date==data_date));trend=list(session.scalars(select(RecommendationMetric).where(RecommendationMetric.date.between(start_date,end_date)).order_by(RecommendationMetric.date)))
    cdates=list(session.scalars(select(HomeChannelMetric.date).distinct().order_by(HomeChannelMetric.date.desc())));gdates=list(session.scalars(select(RecommendationMetric.date).order_by(RecommendationMetric.date.desc())))
    return {"channels":[row(x,cf) for x in channels],"recommendation":row(guess,gf) if guess else None,"recommendation_trend":[row(x,gf) for x in trend],"meta":{"channel":{"source":"data_provider/dramaConversion","available_dates":[x.isoformat() for x in cdates],"original_fields":cf[1:]},"recommendation":{"source":"Quick BI MCP/recommend_data","api_id":"bf3f06e8eb6f","available_dates":[x.isoformat() for x in gdates],"original_fields":gf[2:],"page":"首页","source_type":"猜你喜欢","data_status":"local_mcp_sync"}}}
