from datetime import date
import csv,io
from typing import Literal
from fastapi import APIRouter,Depends,Query,Request,Response
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import ResourcePlacementMetric
from app.repositories.resource_placement import ResourcePlacementRepository

router=APIRouter(prefix="/api/v1",tags=["resource-placement"])
def get_session(request:Request):
    with request.app.state.session_factory() as session: yield session
@router.get("/resource-placements")
def resources(resource_type:Literal["section","banner","popup"],data_date:date=Query(...,alias="date"),page:int=Query(1,ge=1),page_size:int=Query(15,ge=1,le=50),sort:Literal["exposure_uv","click_uv","ctr","play_uv"]="click_uv",direction:Literal["asc","desc"]="desc",search:str|None=None,session:Session=Depends(get_session)):
    repo=ResourcePlacementRepository(session); rows,total=repo.items(resource_type,data_date,page,page_size,sort,direction,search); exposure,click,jump,play=repo.summary(resource_type,data_date)
    fields=["exposure_pv","exposure_uv","click_pv","click_uv","ctr"]+(["jump_pv","jump_uv","play_pv","play_uv","conversion_rate","play_rate"] if resource_type=="popup" else [])
    def item(r): return {k:getattr(r,k) for k in ("name","channel","position","client","exposure_pv","exposure_uv","click_pv","click_uv","jump_pv","jump_uv","play_pv","play_uv","ctr","conversion_rate","play_rate")}
    return {"items":[item(r) for r in rows],"summary":{"exposure_uv":exposure,"click_uv":click,"jump_uv":jump,"play_uv":play,"ctr":click/exposure if exposure and click is not None else None,"conversion_rate":jump/click if click and jump is not None else None,"play_rate":play/jump if jump and play is not None else None},"pagination":{"page":page,"page_size":page_size,"total":total},"meta":{"source":{"section":"data_provider/sectionData","banner":"data_provider/bannerClickData","popup":"data_provider/popupWindowData"}[resource_type],"original_fields":fields,"available_dates":[x.isoformat() for x in repo.dates(resource_type)],"data_status":"snapshot","limitations":["Banner跳转播放字段未接入"] if resource_type=="banner" else []}}
@router.get("/resource-placements/export")
def export_resources(resource_type:Literal["section","banner","popup"],data_date:date=Query(...,alias="date"),sort:Literal["exposure_uv","click_uv","ctr","play_uv"]="click_uv",direction:Literal["asc","desc"]="desc",search:str|None=None,session:Session=Depends(get_session)):
    cols={"exposure_uv":ResourcePlacementMetric.exposure_uv,"click_uv":ResourcePlacementMetric.click_uv,"ctr":ResourcePlacementMetric.ctr,"play_uv":ResourcePlacementMetric.play_uv};order=cols[sort].asc() if direction=="asc" else cols[sort].desc();query=select(ResourcePlacementMetric).where(ResourcePlacementMetric.resource_type==resource_type,ResourcePlacementMetric.date==data_date)
    if search:query=query.where(ResourcePlacementMetric.name.contains(search.strip()))
    rows=list(session.scalars(query.order_by(order,ResourcePlacementMetric.name).limit(5000)));output=io.StringIO();writer=csv.writer(output);writer.writerow(["日期","类型","名称","频道","位置","客户端","曝光PV","曝光UV","点击PV","点击UV","点击率","跳转UV","有效播放UV","有效播放率"])
    for r in rows:writer.writerow([r.date.isoformat(),resource_type,r.name,r.channel or "",r.position or "",r.client or "",r.exposure_pv,r.exposure_uv,r.click_pv,r.click_uv,r.ctr,r.jump_uv,r.play_uv,r.play_rate])
    filename=f"resource-{resource_type}-{data_date.isoformat()}.csv";return Response("\ufeff"+output.getvalue(),media_type="text/csv; charset=utf-8",headers={"Content-Disposition":f'attachment; filename="{filename}"',"X-Export-Row-Count":str(len(rows)),"X-Export-Limit":"5000"})
