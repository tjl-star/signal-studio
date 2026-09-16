from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path

from sqlalchemy.dialects.sqlite import insert

from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database
from app.models import SearchConversionDaily, SyncRun


@dataclass(frozen=True)
class SearchConversionImportResult:
    inserted_or_updated: int
    start_date: str
    end_date: str


def parse_rate(value: object) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return float(str(value).strip().removesuffix("%")) / 100


def import_search_conversion_snapshot(source_file: Path, database_url: str | None = None) -> SearchConversionImportResult:
    database_url = database_url or default_database_url()
    payload = json.loads(Path(source_file).read_text(encoding="utf-8-sig"))
    rows = payload.get("rows") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("Search conversion snapshot does not contain rows")
    now = datetime.now(UTC)
    records = []
    for row in rows:
        raw_date = str(row.get("date", ""))
        parsed_date = datetime.strptime(raw_date, "%Y%m%d").date()
        records.append({
            "date": parsed_date,
            "into_search_click_uv": row.get("into_search_click_uv"),
            "search_suc_uv": row.get("search_suc_uv"),
            "search_suc_uv_ratio": parse_rate(row.get("search_suc_uv_ratio")),
            "result_content_click_uv": row.get("result_content_click_uv"),
            "result_video_after_ad_play_start_uv": row.get("result_video_after_ad_play_start_uv"),
            "result_play_5mins_uv": row.get("result_play_5mins_uv"),
            "ff_play_uv_rate": parse_rate(row.get("ff_play_uv_rate")),
            "play_5min_uv_rate": parse_rate(row.get("play_5min_uv_rate")),
            "result_play_time_uv": row.get("result_play_time_uv"),
            "synced_at": now,
        })
    engine = create_database_engine(database_url)
    upgrade_database(database_url)
    factory = create_session_factory(engine)
    excluded = insert(SearchConversionDaily).excluded
    fields = [key for key in records[0] if key != "date"]
    with factory.begin() as session:
        statement = insert(SearchConversionDaily).values(records)
        session.execute(statement.on_conflict_do_update(index_elements=["date"], set_={key: getattr(excluded, key) for key in fields}))
        session.add(SyncRun(dataset="search_conversion", status="success", row_count=len(records), start_date=min(x["date"] for x in records), end_date=max(x["date"] for x in records), source="Quick BI MCP/search_drama_conversion_data", completed_at=now))
    engine.dispose()
    return SearchConversionImportResult(len(records), min(x["date"] for x in records).isoformat(), max(x["date"] for x in records).isoformat())
