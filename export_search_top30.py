import csv
import json
import os

out_dir = r"C:\Users\tjldq\Desktop\搜索"
os.makedirs(out_dir, exist_ok=True)
fields = [
    "ds", "search_rank", "series_name", "season_num", "season_id",
    "search_cnt", "search_uv", "search_minus_play_rank",
    "search_cnt_day_rate", "client_type", "new_old_device",
    "content_category", "genre_tag",
]
rows = []
for date in ("20260804", "20260805"):
    source = f"season_{date}_full.json" if os.path.exists(f"season_{date}_full.json") else f"season_{date}.json"
    raw = open(source, "rb").read()
    encoding = "utf-16" if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff") else "utf-8-sig"
    data = json.loads(raw.decode(encoding))
    for item in sorted(data, key=lambda x: x.get("search_rank", 10**9))[:30]:
        rows.append({
            "ds": item.get("ds"),
            "search_rank": item.get("search_rank"),
            "series_name": item.get("series_name"),
            "season_num": item.get("season_num"),
            "season_id": item.get("season_id"),
            "search_cnt": item.get("search_cnt"),
            "search_uv": item.get("search_uv"),
            "search_minus_play_rank": item.get("search_minus_play_rank"),
            "search_cnt_day_rate": "不支持",
            "client_type": "不支持",
            "new_old_device": "不支持",
            "content_category": "不支持",
            "genre_tag": "不支持",
        })

path = os.path.join(out_dir, "最近两天热搜剧集季维度Top30.csv")
with open(path, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
print(path)
print(len(rows))
