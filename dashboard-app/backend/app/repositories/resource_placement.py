from datetime import date
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import ResourcePlacementMetric

SORTS={"exposure_uv":ResourcePlacementMetric.exposure_uv,"click_uv":ResourcePlacementMetric.click_uv,"ctr":ResourcePlacementMetric.ctr,"play_uv":ResourcePlacementMetric.play_uv}
class ResourcePlacementRepository:
    def __init__(self,session:Session): self.session=session
    def dates(self,kind): return list(self.session.scalars(select(ResourcePlacementMetric.date).where(ResourcePlacementMetric.resource_type==kind).distinct().order_by(ResourcePlacementMetric.date.desc())))
    def items(self,kind,data_date,page,page_size,sort,direction,search=None):
        filters=[ResourcePlacementMetric.resource_type==kind,ResourcePlacementMetric.date==data_date]
        if search: filters.append(ResourcePlacementMetric.name.contains(search))
        count=int(self.session.scalar(select(func.count()).select_from(ResourcePlacementMetric).where(*filters)) or 0)
        col=SORTS[sort]; order=col.asc() if direction=="asc" else col.desc()
        rows=list(self.session.scalars(select(ResourcePlacementMetric).where(*filters).order_by(order,ResourcePlacementMetric.name).offset((page-1)*page_size).limit(page_size)))
        return rows,count
    def summary(self,kind,data_date):
        return self.session.execute(select(func.sum(ResourcePlacementMetric.exposure_uv),func.sum(ResourcePlacementMetric.click_uv),func.sum(ResourcePlacementMetric.jump_uv),func.sum(ResourcePlacementMetric.play_uv)).where(ResourcePlacementMetric.resource_type==kind,ResourcePlacementMetric.date==data_date)).one()
