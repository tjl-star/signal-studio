import calendar
from collections import defaultdict
from datetime import date
from fastapi import APIRouter,Depends,Query,Request
from sqlalchemy import distinct,select
from sqlalchemy.orm import Session
from app.models import ContentRankingEntry,DailyOverviewMetric,GenreContributionSummary,HomeChannelMetric,ResourcePlacementMetric,SearchRankingEntry
router=APIRouter(prefix="/api/v1",tags=["monthly-report"])
def session(request:Request):
    with request.app.state.session_factory() as s:yield s
def aggregate(rows,name,value,limit=10):
    totals=defaultdict(int)
    for row in rows:
        key=getattr(row,name) or "--";totals[key]+=getattr(row,value) or 0
    return [{"name":k,"value":v} for k,v in sorted(totals.items(),key=lambda x:x[1],reverse=True)[:limit]]
@router.get("/monthly-report")
def monthly_report(month:str=Query(...,pattern=r"^\d{4}-\d{2}$"),client:str="安卓",session:Session=Depends(session)):
    year,number=map(int,month.split("-"));start=date(year,number,1);end=date(year,number,calendar.monthrange(year,number)[1])
    overview=list(session.scalars(select(DailyOverviewMetric).where(DailyOverviewMetric.date.between(start,end),DailyOverviewMetric.client==client).order_by(DailyOverviewMetric.date)));latest=overview[-1] if overview else None
    contents=list(session.scalars(select(ContentRankingEntry).where(ContentRankingEntry.date.between(start,end),ContentRankingEntry.list_type=="总榜")));searches=list(session.scalars(select(SearchRankingEntry).where(SearchRankingEntry.date.between(start,end),SearchRankingEntry.list_type=="总榜")))
    genre_end=session.scalar(select(GenreContributionSummary.period_end).where(GenreContributionSummary.period_end.between(start,end)).order_by(GenreContributionSummary.period_end.desc()).limit(1));genres=list(session.scalars(select(GenreContributionSummary).where(GenreContributionSummary.period_end==genre_end).order_by(GenreContributionSummary.total_play_vv.desc()))) if genre_end else []
    resources=list(session.scalars(select(ResourcePlacementMetric).where(ResourcePlacementMetric.date.between(start,end))));channels=list(session.scalars(select(HomeChannelMetric).where(HomeChannelMetric.date.between(start,end))))
    banner=aggregate([x for x in resources if x.resource_type=="banner"],"name","click_uv",3);popup=aggregate([x for x in resources if x.resource_type=="popup"],"name","play_uv",3);sections=aggregate([x for x in resources if x.resource_type=="section"],"name","click_uv",3);channel_top=aggregate(channels,"channel","effective_play_uv",3)
    content_top=aggregate(contents,"title","play_vv");search_top=aggregate(searches,"title","search_uv");content_names={x["name"] for x in content_top};overlap=[x["name"] for x in search_top if x["name"] in content_names]
    genre_total=sum(x.total_play_vv for x in genres);genre_rows=[{"name":x.genre,"value":x.total_play_vv,"share":x.total_play_vv/genre_total if genre_total else None} for x in genres]
    facts=[]
    if content_top:facts.append(f'{content_top[0]["name"]} 为本月累计播放VV最高内容（{content_top[0]["value"]:,}）。')
    if search_top:facts.append(f'{search_top[0]["name"]} 为本月累计搜索UV最高内容（{search_top[0]["value"]:,}）。')
    if genre_rows:facts.append(f'{genre_rows[0]["name"]} 在最新可用剧种周期中的播放VV占比最高（{genre_rows[0]["share"]*100:.2f}%）。')
    if overlap:facts.append(f'热播与热搜 Top10 有 {len(overlap)} 个内容重合。')
    months=list(session.scalars(select(distinct(DailyOverviewMetric.date)).order_by(DailyOverviewMetric.date.desc())));available=sorted({x.strftime("%Y-%m") for x in months},reverse=True)
    return {"month":month,"client":client,"coverage":{"start":overview[0].date if overview else None,"end":latest.date if latest else None,"days":len(overview)},"overview":{"latest_device_dau":latest.device_dau if latest else None,"new_device_total":sum(x.new_device or 0 for x in overview),"latest_play_rate":latest.play_rate if latest else None,"latest_avg_watch_duration":latest.avg_watch_duration if latest else None,"latest_avg_play_count":latest.avg_play_count if latest else None,"daily":[{"date":x.date,"device_dau":x.device_dau,"new_device":x.new_device} for x in overview]},"content_top":content_top,"search_top":search_top,"hot_play_overlap":overlap,"genres":genre_rows,"operations":{"channels":channel_top,"sections":sections,"banners":banner,"popups":popup},"facts":facts,"available_months":available,"meta":{"sources":[{"section":"大盘","source":"data_provider/coreData, perCapitaWatchDuration, perCapitaPlayCount"},{"section":"热播","source":"data_provider/playTop10"},{"section":"热搜","source":"data_provider/seasonSearchAuthInfo"},{"section":"剧种","source":"data_provider/seasonPlayVV"},{"section":"运营资源","source":"data_provider/dramaConversion, sectionData, bannerClickData, popupWindowData"}],"note":"各章节保持原数据源口径，月报只汇总最终入库结果，不跨接口反推缺失指标。"}}
