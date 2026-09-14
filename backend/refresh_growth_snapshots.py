"""Refresh the BL and genre-contribution snapshots from the approved play data.

The two growth tabs consume compact snapshots in addition to the daily files
maintained by ``refresh_current_daily_snapshot.py``.  This updater reuses the
local daily snapshots for BL totals, refreshes the latest seven-day
``seasonPlayVV`` period, and rebuilds the derived content-growth file.
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import date, timedelta
from pathlib import Path

import sys

SKILL_SCRIPTS = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts")
if str(SKILL_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SKILL_SCRIPTS))
import data_provider  # type: ignore  # approved read-only data interface


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "dashboard-v2" / "data"
DAILY_DIR = DATA_DIR / "season_play_daily"
BL_OUT = DATA_DIR / "bl_daily_snapshot_20260701_20260831.json"
WEEKLY_OUT = DATA_DIR / "season_play_weekly_20260706_20260831.json"


def rows_from(value):
    if isinstance(value, list):
        return value
    if isinstance(value, dict) and isinstance(value.get("rows"), list):
        return value["rows"]
    return []


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def available_days() -> list[str]:
    days = []
    for path in DAILY_DIR.glob("*.json"):
        try:
            value = date.fromisoformat(path.stem)
        except ValueError:
            continue
        days.append(value.isoformat())
    return sorted(set(days))


def build_bl_snapshot(days: list[str]) -> dict:
    result = []
    for day in days:
        payload = read_json(DAILY_DIR / f"{day}.json")
        rows = rows_from(payload)
        if not rows:
            raise ValueError(f"season_play_daily {day} 没有明细")
        bl_rows = [row for row in rows if "同性" in str(row.get("plot_type") or "").split(",")]
        result.append(
            {
                "date": day,
                "total_play_vv": sum(float(row.get("play_count") or 0) for row in rows),
                "total_content_play_uv": sum(float(row.get("play_uv") or 0) for row in rows),
                "bl_play_vv": sum(float(row.get("play_count") or 0) for row in bl_rows),
                "bl_content_play_uv": sum(float(row.get("play_uv") or 0) for row in bl_rows),
                "bl_rows": [
                    {
                        "season_id": row.get("season_id"),
                        "title": row.get("title") or "未命名内容",
                        "season_type": row.get("season_type"),
                        "season_classify": row.get("season_classify") or "--",
                        "plot_type": row.get("plot_type") or "--",
                        "producer_region": row.get("producer_region") or "--",
                        "play_count": row.get("play_count") or 0,
                        "play_uv": row.get("play_uv") or 0,
                    }
                    for row in bl_rows
                ],
                "source": "data_provider/seasonPlayVV",
            }
        )
    return {
        "date_range": [days[0], days[-1]],
        "bl_rule": "plot_type contains exact label 同性",
        "days": result,
        "source": "data_provider/seasonPlayVV",
    }


def refresh_latest_week(days: list[str]) -> tuple[str, str, int]:
    latest = date.fromisoformat(days[-1])
    start = latest - timedelta(days=6)
    period_start, period_end = start.isoformat(), latest.isoformat()
    raw = rows_from(
        data_provider.query(
            "seasonPlayVV",
            {"startDate": period_start, "endDate": period_end},
        )
    )
    if not raw:
        raise ValueError(f"seasonPlayVV {period_start}..{period_end} 返回空数据")
    required = {"season_id", "title", "season_type", "play_count", "play_uv"}
    missing = required - set(raw[0])
    if missing:
        raise ValueError(f"seasonPlayVV 原始字段缺失：{sorted(missing)}")
    existing = rows_from(read_json(WEEKLY_OUT)) if WEEKLY_OUT.exists() else []
    kept = [
        row
        for row in existing
        if not (row.get("period_start") == period_start and row.get("period_end") == period_end)
    ]
    incoming = [
        {
            "period_start": period_start,
            "period_end": period_end,
            "season_id": row.get("season_id"),
            "title": row.get("title"),
            "season_type": row.get("season_type"),
            "season_classify": row.get("season_classify"),
            "plot_type": row.get("plot_type"),
            "producer_region": row.get("producer_region"),
            "play_count": row.get("play_count"),
            "play_uv": row.get("play_uv"),
            "has_copyright": row.get("has_copyright"),
            "source": "data_provider/seasonPlayVV",
        }
        for row in raw
    ]
    write_json(WEEKLY_OUT, kept + incoming)
    return period_start, period_end, len(incoming)


def main() -> None:
    days = [day for day in available_days() if day >= "2026-07-01"]
    if not days:
        raise ValueError("没有找到 season_play_daily 快照")
    write_json(BL_OUT, build_bl_snapshot(days))
    period_start, period_end, rows = refresh_latest_week(days)

    # Import only after the weekly source has been replaced so the existing
    # derived-data builder reads the refreshed, approved snapshot.
    sys.path.insert(0, str(ROOT / "backend"))
    import build_growth_tab_data  # type: ignore

    build_growth_tab_data.main()
    print(
        json.dumps(
            {
                "bl_date_range": [days[0], days[-1]],
                "latest_period": [period_start, period_end],
                "latest_period_rows": rows,
                "source": "data_provider/seasonPlayVV",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
