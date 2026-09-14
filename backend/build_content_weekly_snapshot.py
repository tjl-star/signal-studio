"""Build verified weekly season-play snapshots from the project data provider.

The provider aggregates a requested date interval by season, so this script
queries complete calendar weeks separately and keeps the source fields intact.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROVIDER = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py")
PYTHON = Path(r"C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
OUT = ROOT / "dashboard-v2" / "data" / "season_play_weekly_20260706_20260831.json"

def periods(end: date) -> list[tuple[str, str]]:
    first = date(2026, 7, 1)
    result = []
    cursor = first
    while cursor <= end:
        period_end = min(cursor + timedelta(days=(6 - cursor.weekday()) % 7), end)
        result.append((cursor.isoformat(), period_end.isoformat()))
        cursor = period_end + timedelta(days=1)
    return result


def query(start: str, end: str) -> list[dict]:
    result = subprocess.run(
        [str(PYTHON), str(PROVIDER), "season-play-vv", "--start-date", start, "--end-date", end],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    return json.loads(result.stdout)


def main() -> None:
    end = date.fromisoformat(os.getenv("CONTENT_WEEKLY_END", (date.today() - timedelta(days=1)).isoformat()))
    weeks = periods(end)
    records: list[dict] = []
    for start, period_end in weeks:
        rows = query(start, period_end)
        for row in rows:
            records.append(
                {
                    "period_start": start,
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
            )
        print(f"{start}..{period_end}: {len(rows)} rows", flush=True)
    OUT.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({len(records)} rows)")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
