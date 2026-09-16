from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ContentRankingEntry


SORT_COLUMNS = {
    "rank": ContentRankingEntry.rank,
    "play_vv": ContentRankingEntry.play_vv,
    "day_change": ContentRankingEntry.day_change_rate,
}


class ContentRankingRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_dates(self, list_type: str) -> list[date]:
        statement = (
            select(ContentRankingEntry.date)
            .where(ContentRankingEntry.list_type == list_type)
            .distinct()
            .order_by(ContentRankingEntry.date.desc())
        )
        return list(self.session.scalars(statement))

    def count(self, data_date: date, list_type: str) -> int:
        statement = select(func.count(ContentRankingEntry.id)).where(
            ContentRankingEntry.date == data_date,
            ContentRankingEntry.list_type == list_type,
        )
        return int(self.session.scalar(statement) or 0)

    def list_entries(
        self,
        data_date: date,
        list_type: str,
        page: int,
        page_size: int,
        sort: str,
        direction: str,
    ) -> list[ContentRankingEntry]:
        column = SORT_COLUMNS[sort]
        order = column.asc() if direction == "asc" else column.desc()
        statement = (
            select(ContentRankingEntry)
            .where(
                ContentRankingEntry.date == data_date,
                ContentRankingEntry.list_type == list_type,
            )
            .order_by(order, ContentRankingEntry.rank.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(self.session.scalars(statement))
