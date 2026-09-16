from __future__ import annotations

from datetime import date

from app.repositories.overview import OverviewRepository


METRIC_FIELDS = ("device_dau", "new_device", "play_rate", "avg_watch_duration", "avg_play_count")
BREAKDOWN_CLIENTS = ("安卓", "iOS", "M站")


def relative_change(current: float | int | None, previous: float | int | None) -> float | None:
    if current is None or previous in (None, 0):
        return None
    return round((current - previous) / abs(previous), 6)


class OverviewService:
    def __init__(self, repository: OverviewRepository):
        self.repository = repository

    def get_overview(self, start_date: date, end_date: date, client: str) -> dict:
        records = self.repository.list_metrics(start_date, end_date, client)
        client_records = self.repository.list_latest_client_metrics(
            start_date,
            end_date,
            BREAKDOWN_CLIENTS,
        )
        trend = [
            {
                "date": row.date.isoformat(),
                **{field: getattr(row, field) for field in METRIC_FIELDS},
            }
            for row in records
        ]
        current = trend[-1] if trend else {}
        previous = trend[-2] if len(trend) > 1 else {}
        summary = {field: current.get(field) for field in METRIC_FIELDS}
        comparison = {
            field: relative_change(current.get(field), previous.get(field))
            for field in METRIC_FIELDS
        }
        return {
            "summary": summary,
            "comparison": comparison,
            "trend": trend,
            "client_breakdown": [
                {
                    "date": row.date.isoformat(),
                    "client": row.client,
                    **{field: getattr(row, field) for field in METRIC_FIELDS},
                }
                for row in client_records
            ],
            "meta": {
                "source": "data_provider/coreData",
                "component": "coreData / perCapitaWatchDuration / perCapitaPlayCount",
                "original_fields": [
                    "device_dau",
                    "new_device",
                    "play_rate",
                    "total_avg_watch_duration",
                    "total_avg_play_count",
                ],
                "filters": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "client": client,
                },
                "data_status": "snapshot",
                "client_breakdown_scope": "安卓 / iOS / M站，取筛选日期范围内各客户端最新同日记录",
            },
        }
