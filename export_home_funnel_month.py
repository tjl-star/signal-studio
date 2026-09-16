import csv
import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

SCRIPT = Path(r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py")
PYTHON = Path(r"C:\Users\tjldq\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe")
OUT = Path(r"C:\Users\tjldq\Desktop\首页流量与转化漏斗")
CHANNELS = ["精选", "电影", "美剧", "英剧", "韩剧", "日剧", "泰剧", "国产剧", "动漫", "短视频"]
START = date(2026, 7, 5)
END = date(2026, 8, 4)

def query(channel):
    cmd = [str(PYTHON), str(SCRIPT), "drama-conversion", "--start-date", str(START), "--end-date", str(END), "--source-channel", channel]
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(result.stdout)

def main():
    rows = []
    for channel in CHANNELS:
        for item in query(channel):
            rows.append({
                "日期": item.get("date"), "频道类型": channel, "频道名称": channel,
                "首页进入频道页UV": item.get("tab_click_uv"), "频道页内容点击UV": item.get("content_click_uv"),
                "详情播放UV": item.get("detail_play_uv"), "播放超过5分钟UV": item.get("detail_play_5_mins_uv"),
                "有效播放UV": item.get("video_uv"),
                "首页进入→频道点击转化率": item.get("content_click_uv_rate"),
                "频道点击→详情播放转化率": item.get("detail_play_uv_rate"),
                "详情播放→5分钟有效播放转化率": item.get("detail_play_5_mins_uv_rate"),
                "5分钟有效播放→有效播放转化率": item.get("video_uv_rate"),
                "数据来源": "/skill/dramaConversion", "端口口径": "全部端口", "设备口径": "全部设备",
            })

    expected_dates = [(START + timedelta(days=i)).isoformat() for i in range((END - START).days + 1)]
    missing_channel_dates = []
    for channel in CHANNELS:
        got = {r["日期"] for r in rows if r["频道名称"] == channel}
        missing_channel_dates.extend({"频道": channel, "缺失日期": d} for d in expected_dates if d not in got)
    uv_fields = ["首页进入频道页UV", "频道页内容点击UV", "详情播放UV", "播放超过5分钟UV", "有效播放UV"]
    missing_fields = sum(any(r.get(field) is None for field in uv_fields) for r in rows)
    payload = {
        "module": "各频道流量与转化漏斗",
        "requested_as_of": END.isoformat(),
        "date_range": {"start": START.isoformat(), "end": END.isoformat(), "days": len(expected_dates)},
        "channel_options": CHANNELS,
        "fields": list(rows[0].keys()) if rows else [],
        "rows": rows,
        "validation": {
            "requested_channels": len(CHANNELS), "returned_rows": len(rows),
            "returned_dates": len({r["日期"] for r in rows}), "expected_rows": len(CHANNELS) * len(expected_dates),
            "missing_channel_dates": missing_channel_dates, "missing_required_uv_field_rows": missing_fields,
            "zero_values_are_real_returned_values": True,
        },
        "source_note": "字段按 dramaConversion 原始返回映射；未用其他指标补齐。",
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "首页流量与转化漏斗_20260705_20260804.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    with (OUT / "首页流量与转化漏斗_20260705_20260804.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=payload["fields"])
        writer.writeheader()
        writer.writerows(rows)
    (OUT / "README_数据说明.txt").write_text(
        "首页流量与转化漏斗\n\n"
        "数据范围：2026-07-05 至 2026-08-04，共 31 天。\n"
        f"频道：{'、'.join(CHANNELS)}。\n"
        "字段来源：/skill/dramaConversion，全部端口、全部设备。\n"
        "字段完整性：每个频道每天均返回记录时才判定为完整；0 为接口真实返回值。\n",
        encoding="utf-8",
    )
    print(json.dumps({"output_dir": str(OUT), "rows": len(rows), "expected_rows": len(CHANNELS) * len(expected_dates), "missing_channel_dates": len(missing_channel_dates), "missing_required_uv_field_rows": missing_fields}, ensure_ascii=False))

if __name__ == "__main__":
    main()
