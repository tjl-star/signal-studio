from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import DailyOverviewMetric


class OverviewRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_metrics(self, start_date: date, end_date: date, client: str) -> list[DailyOverviewMetric]:
        statement = (
            select(DailyOverviewMetric)
            .where(
                DailyOverviewMetric.date >= start_date,
                DailyOverviewMetric.date <= end_date,
                DailyOverviewMetric.client == client,
            )
            .order_by(DailyOverviewMetric.date)
        )
        return list(self.session.scalars(statement))

    def list_latest_client_metrics(
        self,
        start_date: date,
        end_date: date,
        clients: tuple[str, ...],
    ) -> list[DailyOverviewMetric]:
        latest_dates = (
            select(
                DailyOverviewMetric.client.label("client"),
                func.max(DailyOverviewMetric.date).label("latest_date"),
            )
            .where(
                DailyOverviewMetric.date >= start_date,
                DailyOverviewMetric.date <= end_date,
                DailyOverviewMetric.client.in_(clients),
            )
            .group_by(DailyOverviewMetric.client)
            .subquery()
        )
        statement = (
            select(DailyOverviewMetric)
            .join(
                latest_dates,
                (DailyOverviewMetric.client == latest_dates.c.client)
                & (DailyOverviewMetric.date == latest_dates.c.latest_date),
            )
            .order_by(DailyOverviewMetric.client)
        )
        rows = list(self.session.scalars(statement))
        by_client = {row.client: row for row in rows}
        return [by_client[client] for client in clients if client in by_client]
