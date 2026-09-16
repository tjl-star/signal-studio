import csv
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from urllib.parse import urlencode
from urllib.request import urlopen


BASE_URL = os.environ.get("DATA_PROVIDER_BASE_URL", "http://101.132.68.174:8123").rstrip("/")
OUTPUT_DIR = os.path.join(os.environ.get("USERPROFILE", "C:\\Users\\Public"), "Desktop", "首页流量与转化漏斗")
START_DATE = date(2026, 7, 4)
END_DATE = date(2026, 8, 4)
CHANNELS = ["精选", "新人(精选)", "美剧", "日剧", "韩剧", "泰剧", "国产剧", "英剧", "电影"]


def query_json(endpoint, params):
    url = f"{BASE_URL}/skill/{endpoint}?{urlencode(params)}"
    with urlopen(url, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def dates_between(start, end):
    current = start
    while current <= end:
        yield current.isoformat()
        current += timedelta(days=1)


def client_groups(client_types):
    groups = {
        "安卓": sorted(x for x in client_types if x.startswith("android")),
        "iOS": sorted(x for x in client_types if x.startswith(("ios_", "ipad_"))),
        "M站": sorted(x for x in client_types if x in {"web_applet", "web_pc"}),
    }
    return {name: "#".join(values) for name, values in groups.items() if values}


def fetch_one(item):
    platform, clienttype, channel, device = item
    payload = query_json(
        "dramaConversion",
        {
            "startDate": START_DATE.isoformat(),
            "endDate": END_DATE.isoformat(),
            "source_channel": channel,
            "clienttype": clienttype,
            "device_type": device,
        },
    )
    values = payload.get("value", []) if isinstance(payload, dict) else []
    return {
        "platform": platform,
        "channel": channel,
        "device_type": "新设备" if device == "new" else "老设备",
        "clienttype_filter": clienttype,
        "rows": values,
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    client_info = query_json("getAllClientTypeInfo", {})
    client_types = [row["client_type"] for row in client_info.get("value", [])]
    groups = client_groups(client_types)
    jobs = [
        (platform, clienttype, channel, device)
        for platform, clienttype in groups.items()
        for channel in CHANNELS
        for device in ("new", "old")
    ]

    responses = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(fetch_one, job) for job in jobs]
        for future in as_completed(futures):
            responses.append(future.result())
    responses.sort(key=lambda x: (x["platform"], x["channel"], x["device_type"]))

    raw_rows = []
    for result in responses:
        for row in result["rows"]:
            raw_rows.append(
                {
                    "date": row.get("date"),
                    "channel": result["channel"],
                    "client": result["platform"],
                    "device": result["device_type"],
                    "homepage_channel_click_uv": row.get("tab_click_uv"),
                    "content_click_uv": row.get("content_click_uv"),
                    "detail_play_uv": row.get("detail_play_uv"),
                    "first_frame_play_uv_rate": row.get("first_frame_play_uv_rate"),
                    "play_5_mins_uv_rate": row.get("play_5_mins_uv_rate"),
                    "source": "dramaConversion.tab_click_uv",
                }
            )
    raw_rows.sort(key=lambda x: (x["date"] or "", x["channel"], x["client"], x["device"]))

    all_dates = list(dates_between(START_DATE, END_DATE))
    row_map = {(r["date"], r["channel"], r["client"], r["device"]): r for r in raw_rows}
    dense_rows = []
    for day in all_dates:
        for channel in CHANNELS:
            for platform in groups:
                for device in ("新设备", "老设备"):
                    key = (day, channel, platform, device)
                    dense_rows.append(row_map.get(key, {
                        "date": day,
                        "channel": channel,
                        "client": platform,
                        "device": device,
                        "homepage_channel_click_uv": None,
                        "content_click_uv": None,
                        "detail_play_uv": None,
                        "first_frame_play_uv_rate": None,
                        "play_5_mins_uv_rate": None,
                        "source": "dramaConversion.tab_click_uv",
                    }))

    manifest = {
        "source": "data-provider /skill/dramaConversion",
        "endpoint_field": "tab_click_uv",
        "endpoint_field_meaning": "首页频道点击UV",
        "date_range": [START_DATE.isoformat(), END_DATE.isoformat()],
        "channels": CHANNELS,
        "client_groups": groups,
        "device_types": {"new": "新设备", "old": "老设备"},
        "query_count": len(jobs),
        "returned_row_count": len(raw_rows),
        "dense_row_count": len(dense_rows),
        "note": "空值表示该频道/客户端/设备组合在接口中未返回记录，不以0替代。",
    }

    with open(os.path.join(OUTPUT_DIR, "首页频道入口流量_明细.json"), "w", encoding="utf-8") as handle:
        json.dump({"manifest": manifest, "rows": raw_rows}, handle, ensure_ascii=False, indent=2)
    with open(os.path.join(OUTPUT_DIR, "首页频道入口流量_完整矩阵.csv"), "w", encoding="utf-8-sig", newline="") as handle:
        fieldnames = ["date", "channel", "client", "device", "homepage_channel_click_uv", "content_click_uv", "detail_play_uv", "first_frame_play_uv_rate", "play_5_mins_uv_rate", "source"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dense_rows)
    with open(os.path.join(OUTPUT_DIR, "查询说明.txt"), "w", encoding="utf-8") as handle:
        handle.write(json.dumps(manifest, ensure_ascii=False, indent=2))
        handle.write("\n")

    print(json.dumps({"output_dir": OUTPUT_DIR, "manifest": manifest}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"导出失败: {exc}", file=sys.stderr)
        raise
