"""Build compact daily BL snapshots for calendar-driven BL analysis."""

from __future__ import annotations

import json
import os
import subprocess
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROVIDER = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py")
PYTHON = Path(r"C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
OUT = ROOT / "dashboard-v2" / "data" / "bl_daily_snapshot_20260701_20260831.json"


def query(day: str) -> list[dict]:
    result = subprocess.run([str(PYTHON), str(PROVIDER), "season-play-vv", "--start-date", day, "--end-date", day], check=True, capture_output=True, text=True, encoding="utf-8", env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    return json.loads(result.stdout)


def main() -> None:
    current = date(2026, 7, 1)
    end = date.fromisoformat(os.getenv("BL_SNAPSHOT_END", (date.today() - timedelta(days=1)).isoformat()))
    daily_dir = ROOT / "dashboard-v2" / "data" / "season_play_daily"
    daily_dir.mkdir(parents=True, exist_ok=True)
    days: list[dict] = []
    while current <= end:
        day = current.isoformat()
        rows = query(day)
        normalized = [{key: row.get(key) for key in ("season_id", "title", "season_type", "season_classify", "plot_type", "producer_region", "play_count", "play_uv", "has_copyright")} for row in rows]
        (daily_dir / f"{day}.json").write_text(json.dumps({"date": day, "rows": normalized}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        bl = [row for row in rows if "同性" in str(row.get("plot_type") or "").split(",")]
        days.append({
            "date": day,
            "total_play_vv": sum(float(row.get("play_count") or 0) for row in rows),
            "total_content_play_uv": sum(float(row.get("play_uv") or 0) for row in rows),
            "bl_play_vv": sum(float(row.get("play_count") or 0) for row in bl),
            "bl_content_play_uv": sum(float(row.get("play_uv") or 0) for row in bl),
            "bl_rows": [{"season_id": row.get("season_id"), "title": row.get("title") or "未命名内容", "season_type": row.get("season_type"), "season_classify": row.get("season_classify") or "--", "plot_type": row.get("plot_type") or "--", "producer_region": row.get("producer_region") or "--", "play_count": row.get("play_count") or 0, "play_uv": row.get("play_uv") or 0} for row in bl],
            "source": "data_provider/seasonPlayVV",
        })
        print(f"{day}: {len(rows)} rows, BL={len(bl)}", flush=True)
        current += timedelta(days=1)
    OUT.write_text(json.dumps({"date_range": ["2026-07-01", end.isoformat()], "bl_rule": "plot_type contains exact label 同性", "days": days, "source": "data_provider/seasonPlayVV"}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
