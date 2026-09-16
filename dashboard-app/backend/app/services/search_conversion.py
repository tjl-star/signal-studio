from datetime import date

from app.repositories.search_conversion import SearchConversionRepository


FIELDS = ["into_search_click_uv", "search_suc_uv", "result_content_click_uv", "result_video_after_ad_play_start_uv", "result_play_5mins_uv", "search_suc_uv_ratio", "ff_play_uv_rate", "play_5min_uv_rate", "result_play_time_uv"]


def serialize(row):
    if row is None:
        return None
    return {"date": row.date.isoformat(), **{field: getattr(row, field) for field in FIELDS}}


class SearchConversionService:
    def __init__(self, repository: SearchConversionRepository):
        self.repository = repository

    def get(self, data_date: date, start_date: date, end_date: date) -> dict:
        current = self.repository.get(data_date)
        return {
            "current": serialize(current),
            "previous": serialize(self.repository.previous(data_date)),
            "trend": [serialize(row) for row in self.repository.range(start_date, end_date)],
            "meta": {
                "source": "Quick BI MCP",
                "component": "search_drama_conversion_data",
                "api_id": "65dc407f9a53",
                "client_scope": "全客户端",
                "original_fields": FIELDS,
                "available_dates": [value.isoformat() for value in self.repository.dates()],
                "filters": {"date": data_date.isoformat(), "start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
                "data_status": "local_mcp_sync",
            },
        }
