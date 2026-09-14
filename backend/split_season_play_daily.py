import json
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "dashboard-v2" / "data" / "season_play_daily_20260701_20260831.json"
OUT_DIR = SOURCE.parent / "season_play_daily"

def main():
    snapshot = json.loads(SOURCE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(exist_ok=True)
    for day in snapshot.get("days", []):
        target = OUT_DIR / f"{day['date']}.json"
        target.write_text(json.dumps(day, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"saved {len(snapshot.get('days', []))} daily files to {OUT_DIR}")

if __name__ == "__main__":
    main()
