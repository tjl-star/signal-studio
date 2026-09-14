import json
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path

BASE = "http://101.132.68.174:8123/skill/seasonPlayVV"
START = date(2026, 7, 1)
END = date(2026, 8, 31)
OUT = Path(__file__).resolve().parents[1] / "dashboard-v2" / "data" / "season_play_daily_20260701_20260831.json"

def fetch_day(day):
    query = urllib.parse.urlencode({"startDate": day.isoformat(), "endDate": day.isoformat()})
    with urllib.request.urlopen(f"{BASE}?{query}", timeout=120) as response:
        rows = json.load(response)
    compact = []
    for row in rows:
        compact.append({
            "season_id": row.get("season_id"),
            "title": row.get("title", ""),
            "season_type": row.get("season_type", ""),
            "season_classify": row.get("season_classify", ""),
            "plot_type": row.get("plot_type", ""),
            "producer_region": row.get("producer_region", ""),
            "play_count": row.get("play_count", 0),
            "play_uv": row.get("play_uv", 0),
        })
    return day.isoformat(), compact

def main():
    days = []
    cursor = START
    while cursor <= END:
        days.append(cursor)
        cursor += timedelta(days=1)
    result = {"date_range": [START.isoformat(), END.isoformat()], "source": "data_provider/seasonPlayVV", "days": []}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_day, day): day for day in days}
        fetched = {}
        for future in as_completed(futures):
            day, rows = future.result()
            fetched[day] = rows
            print(f"{day}: {len(rows)} rows", flush=True)
    result["days"] = [{"date": day.isoformat(), "rows": fetched[day.isoformat()]} for day in days]
    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"saved {OUT} ({OUT.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
