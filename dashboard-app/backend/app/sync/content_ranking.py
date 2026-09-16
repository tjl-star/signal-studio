from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path

from sqlalchemy.dialects.sqlite import insert

from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database
from app.models import ContentRankingEntry, SyncRun


SUPPORTED_LIST_TYPES = {"总榜", "新用户榜"}
UPSERT_BATCH_SIZE = 200


@dataclass(frozen=True)
class ContentRankingImportResult:
    inserted_or_updated: int
    start_date: str
    end_date: str
    list_types: tuple[str, ...]


def parse_change(value: object) -> float | None:
    text = str(value or "").strip()
    match = re.search(r"([\d.]+)%", text)
    if not match:
        return None
    rate = float(match.group(1)) / 100
    return -rate if text.startswith("↓") else rate


def import_content_ranking_snapshot(
    source_file: Path,
    database_url: str | None = None,
) -> ContentRankingImportResult:
    database_url = database_url or default_database_url()
    payload = json.loads(Path(source_file).read_text(encoding="utf-8-sig"))
    rows = payload.get("rows") if isinstance(payload, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("Content ranking snapshot does not contain rows")

    now = datetime.now(UTC)
    records = []
    dates: set[str] = set()
    list_types: set[str] = set()
    for row in rows:
        list_type = str(row.get("榜单分类", "")).strip()
        if list_type not in SUPPORTED_LIST_TYPES:
            raise ValueError(f"Unsupported content ranking list type: {list_type}")
        row_date = str(row.get("日期", "")).strip()
        rank = int(row["排名"])
        if not 1 <= rank <= 30:
            raise ValueError(f"Ranking is outside Top30: {rank}")
        dates.add(row_date)
        list_types.add(list_type)
        records.append(
            {
                "date": date.fromisoformat(row_date),
                "list_type": list_type,
                "rank": rank,
                "title": str(row.get("内容名称") or "").strip(),
                "season_id": str(row.get("season_id") or "").strip() or None,
                "play_uv": row.get("播放UV") if isinstance(row.get("播放UV"), int) else None,
                "play_vv": row.get("播放VV") if isinstance(row.get("播放VV"), int) else None,
                "day_change_rate": parse_change(row.get("昨日环比")),
                "day_change_text": str(row.get("昨日环比") or "--"),
                "week_change_rate": parse_change(row.get("周环比")),
                "week_change_text": str(row.get("周环比") or "--"),
                "collection_type": str(row.get("聚集类型") or "").strip() or None,
                "content_category": str(row.get("内容分类") or "").strip() or None,
                "genre_tags": str(row.get("题材标签") or "").strip() or None,
                "ranking_status": str(row.get("榜单状态") or "").strip() or None,
                "data_status": str(row.get("数据状态") or "待核验"),
                "source_interface": str(row.get("来源接口") or ""),
                "limitation": str(row.get("限制说明") or "").strip() or None,
                "synced_at": now,
            }
        )

    engine = create_database_engine(database_url)
    upgrade_database(database_url)
    factory = create_session_factory(engine)
    update_fields = {
        name: getattr(insert(ContentRankingEntry).excluded, name)
        for name in (
            "title", "season_id", "play_uv", "play_vv", "day_change_rate", "day_change_text",
            "week_change_rate", "week_change_text", "collection_type", "content_category", "genre_tags",
            "ranking_status", "data_status", "source_interface", "limitation", "synced_at",
        )
    }
    with factory.begin() as session:
        for offset in range(0, len(records), UPSERT_BATCH_SIZE):
            statement = insert(ContentRankingEntry).values(
                records[offset : offset + UPSERT_BATCH_SIZE]
            )
            session.execute(
                statement.on_conflict_do_update(
                    index_elements=["date", "list_type", "rank"],
                    set_=update_fields,
                )
            )
        session.add(
            SyncRun(
                dataset="content_ranking",
                status="success",
                row_count=len(records),
                start_date=date.fromisoformat(min(dates)),
                end_date=date.fromisoformat(max(dates)),
                source="data_provider/seasonPlayVV + playTop10 snapshot",
                completed_at=now,
            )
        )
    engine.dispose()
    return ContentRankingImportResult(len(records), min(dates), max(dates), tuple(sorted(list_types)))
