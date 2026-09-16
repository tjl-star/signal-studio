import json
import os
import shutil
import urllib.parse
import urllib.request
from datetime import date


BASE = "http://101.132.68.174:8123/skill"
START = "2026-07-04"
END = "2026-08-04"
CHANNELS = [
    "\u7cbe\u9009", "\u7535\u5f71", "\u7f8e\u5267", "\u82f1\u5267",
    "\u97e9\u5267", "\u65e5\u5267", "\u6cf0\u5267", "\u56fd\u4ea7\u5267",
]
PROJECT_DATA = os.path.join(os.path.dirname(__file__), "dashboard-v2", "data")


def fetch(endpoint, params):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(f"{BASE}/{endpoint}?{query}")
    with urllib.request.urlopen(request, timeout=120) as response:
        data = json.loads(response.read().decode("utf-8"))
    if isinstance(data, dict) and "value" in data:
        return data["value"]
    return data


def write_json(name, payload):
    with open(os.path.join(PROJECT_DATA, name), "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=True, indent=2)


def main():
    os.makedirs(PROJECT_DATA, exist_ok=True)
    backup_dir = os.path.join(PROJECT_DATA, "tab4-backup-before-all-platform")
    os.makedirs(backup_dir, exist_ok=True)
    for name in (
        "home_channel_traffic_detail.json",
        "home_funnel_requested_fields.json",
        "home_sections_risk_detail.json",
        "banner_click_detail.json",
        "guess_you_like_home_data.json",
        "guess_you_like_home_exposure_conversion.json",
        "guess_you_like_pv_home_data.json",
    ):
        source = os.path.join(PROJECT_DATA, name)
        if os.path.exists(source):
            shutil.copy2(source, os.path.join(backup_dir, name))

    traffic_rows = []
    for channel in CHANNELS:
        for row in fetch("dramaConversion", {
            "startDate": START,
            "endDate": END,
            "source_channel": channel,
        }):
            traffic_rows.append({
                "date": row.get("date"),
                "channel": channel,
                "client": "\u5168\u90e8\u7aef\u53e3",
                "device": "\u5168\u90e8\u8bbe\u5907",
                "homepage_channel_click_uv": row.get("tab_click_uv"),
                "content_click_uv": row.get("content_click_uv"),
                "content_click_uv_rate": row.get("content_click_uv_rate"),
                "detail_play_uv": row.get("detail_play_uv"),
                "play_conversion_uv_rate": row.get("detail_play_uv_rate"),
                "first_frame_play_uv_rate": row.get("first_frame_play_uv_rate"),
                "play_over_5m_uv": row.get("detail_play_5_mins_uv"),
                "play_over_5m_uv_rate": row.get("detail_play_5_mins_uv_rate"),
                "play_over_10m_uv": row.get("detail_play_10_mins_uv"),
                "play_over_10m_uv_rate": row.get("detail_play_10_mins_uv_rate"),
                "total_play_start_uv_including_ads": row.get("detail_play_start_uv"),
                "total_play_start_uv_excluding_ads": row.get("detail_after_ad_play_start_uv"),
                "avg_play_duration": row.get("avg_video_time"),
                "effective_play_uv": row.get("video_uv"),
                "effective_play_uv_rate": row.get("video_uv_rate"),
                "source": "data-provider /skill/dramaConversion, clienttype/device_type omitted",
            })
    traffic_rows.sort(key=lambda row: (row["date"], row["channel"]))
    traffic_manifest = {
        "source": "data-provider /skill/dramaConversion",
        "date_range": [START, END],
        "channels": CHANNELS,
        "client_scope": "\u5168\u90e8\u7aef\u53e3\uff08\u63a5\u53e3\u672a\u4f20 clienttype\uff09",
        "device_scope": "\u5168\u90e8\u8bbe\u5907\uff08\u63a5\u53e3\u672a\u4f20 device_type\uff09",
        "row_count": len(traffic_rows),
        "raw_field_mapping": {
            "homepage_channel_click_uv": "tab_click_uv",
            "content_click_uv": "content_click_uv",
            "detail_play_uv": "detail_play_uv",
            "first_frame_play_uv_rate": "first_frame_play_uv_rate",
            "play_over_5m_uv_rate": "detail_play_5_mins_uv_rate",
            "effective_play_uv": "video_uv",
        },
        "unavailable_fields": ["PV fields", "content exposure UV", "jump play count"],
    }
    traffic_payload = {"manifest": traffic_manifest, "rows": traffic_rows}
    write_json("home_channel_traffic_detail.json", traffic_payload)
    write_json("home_funnel_requested_fields.json", traffic_payload)

    section_rows = []
    for channel in CHANNELS:
        for row in fetch("sectionData", {
            "startDate": START,
            "endDate": END,
            "channel_id": "22",
            "channel": channel,
        }):
            section_rows.append({
                "date": row.get("date"),
                "application_name": "\u65b0\u4eba\u4eba\u89c6\u9891",
                "application_id": "22",
                "board_name": row.get("channel"),
                "sub_board_name": row.get("group_name"),
                "client": "\u5168\u90e8\u7aef\u53e3",
                "risk_level": "\u63a5\u53e3\u539f\u59cb\u8fd4\u56de",
                "exposure_pv": row.get("exposure_count"),
                "exposure_uv": row.get("exposure_user"),
                "click_pv": row.get("click_count"),
                "click_uv": row.get("click_user"),
                "click_ctr_pv": row.get("ctr_pv"),
                "click_ctr_uv": row.get("ctr_uv"),
                "source": "data-provider /skill/sectionData, clienttype omitted",
            })
    section_rows.sort(key=lambda row: (row["date"], row["board_name"], row.get("sub_board_name") or ""))
    section_manifest = {
        "source": "data-provider /skill/sectionData",
        "date_range": [START, END],
        "channels": CHANNELS,
        "client_scope": "\u5168\u90e8\u7aef\u53e3\uff08\u63a5\u53e3\u672a\u4f20 clienttype\uff09",
        "row_count": len(section_rows),
        "raw_field_mapping": {
            "board_name": "channel",
            "sub_board_name": "group_name",
            "exposure_pv": "exposure_count",
            "exposure_uv": "exposure_user",
            "click_pv": "click_count",
            "click_uv": "click_user",
            "click_ctr_pv": "ctr_pv",
            "click_ctr_uv": "ctr_uv",
        },
        "unavailable_fields": ["risk level split in aggregate query"],
    }
    write_json("home_sections_risk_detail.json", {"manifest": section_manifest, "rows": section_rows})

    banner_rows = []
    for channel in CHANNELS:
        for row in fetch("bannerClickData", {
            "startDate": START,
            "endDate": END,
            "position_id": f"{channel}-banner",
        }):
            banner_rows.append({
                "date": row.get("date"),
                "channel": channel,
                "client": "\u5168\u90e8\u7aef\u53e3",
                "clienttype_raw": row.get("clienttype"),
                "position_id": row.get("position_id"),
                "banner_position": row.get("banner_position"),
                "title": row.get("title"),
                "exposure_uv": row.get("uv_expose_count"),
                "click_uv": row.get("uv_click_count"),
                "exposure_pv": row.get("vv_expose_count"),
                "click_pv": row.get("vv_click_count"),
                "ctr_uv": row.get("ctr_uv"),
                "ctr_pv": row.get("ctr_pv"),
                "source": "data-provider /skill/bannerClickData, clienttype omitted",
            })
    banner_rows.sort(key=lambda row: (row["date"], row["channel"], str(row["banner_position"]), row.get("title") or ""))
    banner_manifest = {
        "source": "data-provider /skill/bannerClickData",
        "date_range": [START, END],
        "channels": CHANNELS,
        "client_scope": "\u5168\u90e8\u7aef\u53e3\u67e5\u8be2\uff1bclienttype_raw \u4fdd\u7559\u63a5\u53e3\u5b9e\u9645\u8fd4\u56de\u5e73\u53f0",
        "row_count": len(banner_rows),
        "raw_field_mapping": {
            "exposure_uv": "uv_expose_count",
            "click_uv": "uv_click_count",
            "exposure_pv": "vv_expose_count",
            "click_pv": "vv_click_count",
            "ctr_uv": "ctr_uv",
            "ctr_pv": "ctr_pv",
        },
        "unavailable_fields": ["jump_play_count"],
    }
    write_json("banner_click_detail.json", {"manifest": banner_manifest, "rows": banner_rows})

    guess_raw = fetch("dramaConversion", {
        "startDate": START,
        "endDate": END,
        "source_channel": "\u7cbe\u9009",
    })
    guess_rows = []
    exposure_rows = []
    pv_rows = []
    for row in guess_raw:
        base = {
            "date": row.get("date"),
            "client": "\u5168\u90e8\u7aef\u53e3",
            "source_channel": "\u7cbe\u9009",
        }
        guess_rows.append({
            **base,
            "home_tab_click_uv": row.get("tab_click_uv"),
            "content_exposure_uv": None,
            "content_click_uv": row.get("content_click_uv"),
            "content_click_uv_rate": row.get("content_click_uv_rate"),
            "total_play_start_uv_including_ads": row.get("detail_play_start_uv"),
            "total_play_start_uv_excluding_ads": row.get("detail_after_ad_play_start_uv"),
            "play_uv": row.get("detail_play_uv"),
            "play_conversion_uv_rate": row.get("detail_play_uv_rate"),
            "play_over_5m_uv": row.get("detail_play_5_mins_uv"),
            "play_over_5m_uv_rate": row.get("detail_play_5_mins_uv_rate"),
            "play_over_10m_uv": row.get("detail_play_10_mins_uv"),
            "play_over_10m_uv_rate": row.get("detail_play_10_mins_uv_rate"),
            "avg_play_duration": row.get("avg_video_time"),
            "effective_play_uv": row.get("video_uv"),
            "effective_play_uv_rate": row.get("video_uv_rate"),
            "source": "data-provider /skill/dramaConversion, clienttype omitted",
        })
        exposure_rows.append({
            **base,
            "home_tab_exposure_uv": None,
            "home_tab_exposure_pv": None,
            "first_frame_play_overall_conversion_rate": row.get("first_frame_play_uv_rate"),
            "play_over_5m_overall_conversion_rate": row.get("play_5_mins_uv_rate"),
            "content_exposure_uv": None,
            "content_exposure_pv": None,
            "content_click_uv": row.get("content_click_uv"),
            "content_click_pv": None,
            "content_click_uv_rate": row.get("content_click_uv_rate"),
            "content_click_pv_rate": None,
            "source": "data-provider /skill/dramaConversion, clienttype omitted",
        })
        pv_rows.append({
            **base,
            "homepage_tab_exposure_pv": None,
            "content_exposure_pv": None,
            "content_click_pv": None,
            "content_click_pv_rate": None,
            "total_play_pv_including_ads": None,
            "total_play_pv_excluding_ads": None,
            "play_pv_conversion_rate": None,
            "play_over_5m_pv": None,
            "play_over_5m_pv_rate": None,
            "play_over_10m_pv": None,
            "play_over_10m_pv_rate": None,
            "effective_play_pv": None,
            "effective_play_pv_rate": None,
            "source": "data-provider /skill/dramaConversion: PV fields unavailable",
        })
    guess_manifest = {
        "source": "data-provider /skill/dramaConversion",
        "source_channel": "精选",
        "date_range": [START, END],
        "client_scope": "\u5168\u90e8\u7aef\u53e3\uff08\u63a5\u53e3\u672a\u4f20 clienttype\uff09",
        "row_count": len(guess_rows),
        "unavailable_fields": ["content exposure UV", "all PV fields"],
    }
    write_json("guess_you_like_home_data.json", {"manifest": guess_manifest, "rows": guess_rows})
    write_json("guess_you_like_home_exposure_conversion.json", {"manifest": guess_manifest, "rows": exposure_rows})
    write_json("guess_you_like_pv_home_data.json", {
        "manifest": {**guess_manifest, "unavailable_fields": ["all PV fields"]},
        "rows": pv_rows,
    })

    print(json.dumps({
        "date_range": [START, END],
        "traffic_rows": len(traffic_rows),
        "section_rows": len(section_rows),
        "banner_rows": len(banner_rows),
        "guess_uv_rows": len(guess_rows),
        "guess_pv_rows": len(pv_rows),
        "backup_dir": backup_dir,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
