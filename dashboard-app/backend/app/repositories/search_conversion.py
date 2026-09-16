from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SearchConversionDaily


class SearchConversionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, data_date: date) -> SearchConversionDaily | None:
        return self.session.scalar(select(SearchConversionDaily).where(SearchConversionDaily.date == data_date))

    def previous(self, data_date: date) -> SearchConversionDaily | None:
        return self.session.scalar(select(SearchConversionDaily).where(SearchConversionDaily.date < data_date).order_by(SearchConversionDaily.date.desc()).limit(1))

    def range(self, start_date: date, end_date: date) -> list[SearchConversionDaily]:
        return list(self.session.scalars(select(SearchConversionDaily).where(SearchConversionDaily.date.between(start_date, end_date)).order_by(SearchConversionDaily.date)))

    def dates(self) -> list[date]:
        return list(self.session.scalars(select(SearchConversionDaily.date).order_by(SearchConversionDaily.date.desc())))
