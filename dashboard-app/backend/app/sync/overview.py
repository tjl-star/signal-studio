from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path

from sqlalchemy.dialects.sqlite import insert

from app.database import create_database_engine, create_session_factory, default_database_url
from app.migrations import upgrade_database
from app.models import DailyOverviewMetric, SyncRun


@dataclass(frozen=True)
class ImportResult:
    inserted_or_updated: int
    start_date: str
    end_date: str


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def rows_from(value) -> list[dict]:
    if isinstance(value, list):
        return value
    if isinstance(value, dict) and isinstance(value.get("rows"), list):
        return value["rows"]
    raise ValueError("Snapshot does not contain a row list")


def import_overview_snapshots(source_dir: Path, database_url: str | None = None) -> ImportResult:
    database_url = database_url or default_database_url()
    source_dir = Path(source_dir)
    merged: dict[tuple[str, str], dict] = {}

    core = read_json(source_dir / "new_people_video_daily_active.json")
    for row in rows_from(core):
        key = (row["date"], row["client"])
        merged[key] = {
            "date": row["date"],
            "client": row["client"],
            "device_dau": row.get("device_dau"),
            "new_device": row.get("new_device"),
            "play_rate": row.get("play_rate"),
            "source": "data_provider/coreData",
        }

    play_rates = read_json(source_dir / "播放率_近30天_按客户端.json")
    for row in rows_from(play_rates):
        key = (row["date"], row["client_type"])
        merged.setdefault(key, {"date": row["date"], "client": row["client_type"]})
        merged[key]["play_rate"] = row.get("play_rate")

    durations = read_json(source_dir / "人均播放时长_近30天_按客户端.json")
    for row in rows_from(durations):
        client = row.get("client_type", "全部")
        key = (row["date"], client)
        merged.setdefault(key, {"date": row["date"], "client": client})
        merged[key]["avg_watch_duration"] = row.get("total_avg_watch_duration")

    play_counts = read_json(source_dir / "avg_play_count_by_client.json")
    for row in rows_from(play_counts):
        if "日期" in row:
            row_date = row["日期"]
            for client in ("安卓", "iOS", "M站", "全部"):
                if client not in row:
                    continue
                key = (row_date, client)
                merged.setdefault(key, {"date": row_date, "client": client})
                merged[key]["avg_play_count"] = row.get(client)
            continue
        if "date" in row:
            row_date = row["date"]
            key = (row_date, "全部")
            merged.setdefault(key, {"date": row_date, "client": "全部"})
            merged[key]["avg_play_count"] = row.get("total_avg_play_count")

    dates = sorted({key[0] for key in merged})
    if not dates:
        raise ValueError("No overview rows were found")

    now = datetime.now(UTC)
    metric_fields = (
        "device_dau",
        "new_device",
        "play_rate",
        "avg_watch_duration",
        "avg_play_count",
    )
    records = [
        {
            **values,
            **{field: values.get(field) for field in metric_fields},
            "date": date.fromisoformat(values["date"]),
            "source": values.get("source", "data_provider/coreData"),
            "synced_at": now,
        }
        for values in merged.values()
    ]
    engine = create_database_engine(database_url)
    upgrade_database(database_url)
    factory = create_session_factory(engine)
    update_fields = {
        name: getattr(insert(DailyOverviewMetric).excluded, name)
        for name in (
            "device_dau",
            "new_device",
            "play_rate",
            "avg_watch_duration",
            "avg_play_count",
            "source",
            "synced_at",
        )
    }
    with factory.begin() as session:
        statement = insert(DailyOverviewMetric).values(records)
        session.execute(
            statement.on_conflict_do_update(
                index_elements=["date", "client"],
                set_=update_fields,
            )
        )
        session.add(
            SyncRun(
                dataset="overview",
                status="success",
                row_count=len(records),
                start_date=date.fromisoformat(dates[0]),
                end_date=date.fromisoformat(dates[-1]),
                source="dashboard-app/source-data snapshots",
                completed_at=now,
            )
        )
    engine.dispose()
    return ImportResult(len(records), dates[0], dates[-1])
