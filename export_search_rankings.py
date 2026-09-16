import csv
import json
import sys
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://101.132.68.174:8123/skill/"
OUT = Path(r"C:\Users\tjldq\Desktop\搜索")
START = date(2026, 7, 4)
END = date(2026, 8, 4)


def query(endpoint, params):
    url = BASE + endpoint + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_meta():
    rows = query("seasonPlayVV", {"startDate": END.isoformat(), "endDate": END.isoformat()})
    return {str(row.get("season_id")): row for row in rows if row.get("season_id")}


def fetch_total():
    result = []
    previous = {}
    meta = fetch_meta()
    current = START
    while current <= END:
        day = current.strftime("%Y%m%d")
        rows = query("seasonSearchAuthInfo", {"date": day})
        ranked = sorted(rows, key=lambda row: int(row.get("search_rank") or 999999))[:30]
        for row in ranked:
            sid = str(row.get("season_id") or "")
            old = previous.get(sid) if sid else None
            old_count = old.get("search_cnt") if old else None
            count = row.get("search_cnt")
            if old_count in (None, 0) or count is None:
                wow = None
            else:
                wow = round((count - old_count) / old_count * 100, 2)
            info = meta.get(sid, {})
            result.append({
                "date": current.isoformat(),
                "rank": row.get("search_rank"),
                "title": row.get("series_name") or "",
                "search_vv": count,
                "search_uv": row.get("search_uv"),
                "day_over_day_pct": wow,
                "content_type": info.get("season_classify"),
                "topic_tag": info.get("plot_type"),
                "season_id": row.get("season_id") or None,
                "source": "seasonSearchAuthInfo + seasonPlayVV",
            })
        previous = {str(row.get("season_id")): row for row in rows if row.get("season_id")}
        print(current.isoformat(), len(ranked))
        current += timedelta(days=1)
    return result


def fetch_new_words():
    result = []
    previous = {}
    current = START
    while current <= END:
        rows = query("newDeviceHotWords", {"date": current.isoformat()})
        total_rows = query("seasonSearchAuthInfo", {"date": current.strftime("%Y%m%d")})
        play_rows = query("seasonPlayVV", {"startDate": current.isoformat(), "endDate": current.isoformat()})
        meta_by_id = {str(row.get("season_id")): row for row in play_rows if row.get("season_id")}
        meta_by_title = {row.get("title"): row for row in play_rows if row.get("title")}
        search_by_title = {row.get("series_name"): row for row in total_rows if row.get("series_name")}
        for rank, row in enumerate(rows[:30], 1):
            title = row.get("words") or ""
            old_count = previous.get(title)
            count = row.get("counts")
            wow = None if old_count in (None, 0) or count is None else round((count - old_count) / old_count * 100, 2)
            linked_search = search_by_title.get(title, {})
            linked = meta_by_id.get(str(linked_search.get("season_id") or ""), {}) or meta_by_title.get(title, {})
            result.append({
                "date": current.isoformat(),
                "rank": rank,
                "title": title,
                "search_vv": count,
                "search_uv": None,
                "day_over_day_pct": wow,
                "content_type": linked.get("season_classify"),
                "topic_tag": linked.get("plot_type"),
                "season_id": linked_search.get("season_id") or linked.get("season_id") or None,
                "source": "newDeviceHotWords",
            })
        previous = {row.get("words") or "": row.get("counts") for row in rows}
        current += timedelta(days=1)
    return result


def write_json(name, payload):
    (OUT / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(name, rows):
    fields = ["date", "rank", "title", "search_vv", "search_uv", "day_over_day_pct", "content_type", "topic_tag", "season_id", "source"]
    with (OUT / name).open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = fetch_total()
    new_words = fetch_new_words()
    write_json("热搜总榜_20260704_20260804.json", {"date_range": [START.isoformat(), END.isoformat()], "rows": total})
    write_csv("热搜总榜_20260704_20260804.csv", total)
    write_json("新用户热搜_词频_20260704_20260804.json", {"date_range": [START.isoformat(), END.isoformat()], "rows": new_words})
    write_csv("新用户热搜_词频_20260704_20260804.csv", new_words)
    write_json("新用户热搜_unsupported.json", {
        "status": "unsupported",
        "reason": "seasonSearchAuthInfo ignores new_old/user_type/device_type parameters; no independent new-user search VV/UV association endpoint was available.",
    })
    write_json("新增用户热搜_unsupported.json", {
        "status": "unsupported",
        "reason": "No independent added-user search ranking endpoint was available; total or new-user data is not substituted.",
    })
    write_json("README.json", {
        "date_range": [START.isoformat(), END.isoformat()],
        "available": ["热搜总榜"],
        "unsupported": ["新用户热搜", "新增用户热搜"],
        "notes": "总榜通过 seasonSearchAuthInfo 获取搜索排名、搜索VV、搜索UV，并按 season_id 关联 seasonPlayVV 补充内容分类和题材标签。昨日环比为按同 season_id 的前一日搜索VV计算。",
    })
    print(f"WROTE {OUT}")


if __name__ == "__main__":
    main()
