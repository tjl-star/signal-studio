from __future__ import annotations

from datetime import date

from app.repositories.content_ranking import ContentRankingRepository


class ContentRankingService:
    def __init__(self, repository: ContentRankingRepository):
        self.repository = repository

    def get_rankings(
        self,
        data_date: date,
        list_type: str,
        page: int,
        page_size: int,
        sort: str,
        direction: str,
    ) -> dict:
        available_dates = self.repository.list_dates(list_type)
        total = self.repository.count(data_date, list_type)
        entries = self.repository.list_entries(
            data_date,
            list_type,
            page,
            page_size,
            sort,
            direction,
        )
        top_entries = self.repository.list_entries(
            data_date,
            list_type,
            1,
            10,
            "play_vv",
            "desc",
        )
        serialize = lambda row: {
            "date": row.date.isoformat(),
            "list_type": row.list_type,
            "rank": row.rank,
            "title": row.title,
            "season_id": row.season_id,
            "play_uv": row.play_uv,
            "play_vv": row.play_vv,
            "day_change_rate": row.day_change_rate,
            "day_change_text": row.day_change_text,
            "week_change_rate": row.week_change_rate,
            "week_change_text": row.week_change_text,
            "collection_type": row.collection_type,
            "content_category": row.content_category,
            "genre_tags": row.genre_tags,
            "ranking_status": row.ranking_status,
            "data_status": row.data_status,
            "source_interface": row.source_interface,
            "limitation": row.limitation,
        }
        return {
            "items": [serialize(row) for row in entries],
            "top10": [serialize(row) for row in top_entries],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
            },
            "meta": {
                "source": "data_provider",
                "component": "seasonPlayVV" if list_type == "总榜" else "playTop10",
                "original_fields": [
                    "season_id", "play_uv", "play_count", "drama_type", "plot_type", "season_type",
                ],
                "filters": {
                    "date": data_date.isoformat(),
                    "list_type": list_type,
                    "sort": sort,
                    "direction": direction,
                },
                "available_dates": [value.isoformat() for value in available_dates],
                "data_status": "snapshot",
                "unsupported_list_types": ["新增用户榜"],
            },
        }
