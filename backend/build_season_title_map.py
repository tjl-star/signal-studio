"""Build the stable season_id -> primary title mapping used by the dashboard."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "dashboard-v2" / "data" / "season_play_daily"
OUTPUT = ROOT / "dashboard-v2" / "data" / "season_title_map.json"


def main() -> None:
    latest: dict[str, tuple[str, str]] = {}
    for path in sorted(SOURCE_DIR.glob("*.json")):
        date = path.stem
        payload = json.loads(path.read_text(encoding="utf-8"))
        for row in payload.get("rows", []):
            season_id = str(row.get("season_id") or "").strip()
            title = str(row.get("title") or "").strip()
            if season_id and title and (season_id not in latest or date >= latest[season_id][0]):
                latest[season_id] = (date, title)
    mapping = [{"season_id": season_id, "title": title} for season_id, (_, title) in sorted(latest.items())]
    OUTPUT.write_text(json.dumps(mapping, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUTPUT} ({len(mapping)} seasons)")


if __name__ == "__main__":
    main()
