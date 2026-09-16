import copy
import json
import os
import sys
import tempfile
from datetime import date, timedelta
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "real-data.json"
SKILL_SCRIPT = Path(
    os.environ.get(
        "DATA_PROVIDER_SCRIPT",
        r"C:\Users\tjldq\.codex\skills\data-provider\scripts\data_provider.py",
    )
)
SNAPSHOT_DATE = os.environ.get(
    "DASHBOARD_SNAPSHOT_DATE", (date.today() - timedelta(days=1)).isoformat()
)
PREVIOUS_DATE = (
    date.fromisoformat(SNAPSHOT_DATE) - timedelta(days=1)
).isoformat()
WEEK_START_DATE = (
    date.fromisoformat(SNAPSHOT_DATE) - timedelta(days=6)
).isoformat()
MONTH_START_DATE = (
    date.fromisoformat(SNAPSHOT_DATE) - timedelta(days=29)
).isoformat()


def load_provider():
    if not SKILL_SCRIPT.exists():
        raise FileNotFoundError(f"data-provider script not found: {SKILL_SCRIPT}")
    spec = spec_from_file_location("data_provider_skill", SKILL_SCRIPT)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def query(provider, command, params):
    return provider.query(command, params)


def query_safe(provider, audit, command, params, target_fields):
    try:
        result = query(provider, command, params)
        if ((isinstance(result, list) and result) or (isinstance(result, dict) and result)):
            audit.append({
                "field": target_fields,
                "interface": command,
                "request": params,
                "return": "有数据",
                "reason": None,
                "status": "confirmed",
            })
        else:
            audit.append({
                "field": target_fields,
                "interface": command,
                "request": params,
                "return": "空结果",
                "reason": "接口未返回目标字段数据",
                "status": "pending",
            })
        return result if isinstance(result, (list, dict)) else []
    except Exception as exc:
        audit.append({
            "field": target_fields,
            "interface": command,
            "request": params,
            "return": "请求失败",
            "reason": str(exc),
            "status": "pending",
        })
        return []


def source(command, field, snapshot_date=SNAPSHOT_DATE):
    return f"data-provider:{command}.{field}|snapshot_date={snapshot_date}"


def relative_change(current, previous):
    if previous in (None, 0) or current is None:
        return None
    return (current - previous) / previous


def set_metric(metric, value, status, source_text, unit=None, wow=None):
    metric["value"] = value
    metric["status"] = status
    metric["source"] = source_text
    if unit is not None:
        metric["unit"] = unit
    if wow is not None:
        metric["wow"] = wow


def main():
    provider = load_provider()
    audit = []
    with DATA_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    today = SNAPSHOT_DATE
    previous = PREVIOUS_DATE

    # Monthly range queries reuse existing provider interfaces. They only feed
    # confirmed historical fields; unsupported metrics remain pending below.
    watch_month = query_safe(
        provider, audit, "perCapitaWatchDuration",
        {"startDate": MONTH_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "avg_play_time_30d",
    )
    play_count_month = query_safe(
        provider, audit, "perCapitaPlayCount",
        {"startDate": MONTH_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "avg_play_count_30d",
    )
    genre_month = query_safe(
        provider, audit, "seasonTypePlayRatio",
        {"startDate": MONTH_START_DATE, "endDate": today},
        "genre_play_share_30d",
    )
    source_page_play_month = query_safe(
        provider, audit, "sourcePagePlayData",
        {"startDate": MONTH_START_DATE, "endDate": today},
        "source_page_play_30d",
    )
    drama_conversion_month = query_safe(
        provider, audit, "dramaConversion",
        {"startDate": MONTH_START_DATE, "endDate": today},
        "home_conversion_30d",
    )
    traffic_channels = ["精选", "电影", "美剧", "英剧", "韩剧", "日剧", "泰剧", "国产剧"]
    channel_conversion_month = {}
    for channel_name in traffic_channels:
        channel_conversion_month[channel_name] = query_safe(
            provider,
            audit,
            "dramaConversion",
            {"startDate": MONTH_START_DATE, "endDate": today, "source_channel": channel_name},
            f"频道入口转化:{channel_name}",
        )
    available_play_month = query_safe(
        provider, audit, "availablePlayData",
        {"startDate": MONTH_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "available_play_rate_30d",
    )
    search_conversion_month = query_safe(
        provider, audit, "searchClickConversion",
        {"startDate": MONTH_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "search_conversion_30d",
    )

    watch = query_safe(provider, audit, "perCapitaWatchDuration", {"startDate": today, "endDate": today}, "人均播放时长")
    watch_week = query_safe(
        provider, audit, "perCapitaWatchDuration",
        {"startDate": WEEK_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "人均播放时长近7日",
    )
    watch_previous = query_safe(provider, audit, "perCapitaWatchDuration", {"startDate": previous, "endDate": previous}, "人均播放时长昨日")
    play_count = query_safe(provider, audit, "perCapitaPlayCount", {"startDate": today, "endDate": today}, "人均播放次数")
    play_count_week = query_safe(
        provider, audit, "perCapitaPlayCount",
        {"startDate": WEEK_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "人均播放次数近7日",
    )
    play_count_previous = query_safe(provider, audit, "perCapitaPlayCount", {"startDate": previous, "endDate": previous}, "人均播放次数昨日")
    genre = query_safe(provider, audit, "seasonTypePlayRatio", {"startDate": previous, "endDate": today}, "剧种播放占比")
    hot_play = query_safe(provider, audit, "seasonPlayVV", {"startDate": today, "endDate": today}, "热播榜总榜")
    hot_play_previous = query_safe(provider, audit, "seasonPlayVV", {"startDate": previous, "endDate": previous}, "热播榜昨日")
    hot_words = query_safe(provider, audit, "allDeviceHotWords", {"date": today}, "热搜榜全体用户")
    hot_words_previous = query_safe(provider, audit, "allDeviceHotWords", {"date": previous}, "热搜榜全体用户昨日")
    new_hot_words = query_safe(provider, audit, "newDeviceHotWords", {"date": today}, "热搜榜新用户")
    new_hot_words_previous = query_safe(provider, audit, "newDeviceHotWords", {"date": previous}, "热搜榜新用户昨日")
    sections = query_safe(provider, audit, "sectionData", {"startDate": today, "endDate": today}, "首页板块曝光点击")
    sections_month = query_safe(
        provider, audit, "sectionData",
        {"startDate": MONTH_START_DATE, "endDate": today}, "首页板块曝光点击近30日",
    )
    banners = query_safe(provider, audit, "bannerClickData", {"startDate": today, "endDate": today}, "Banner曝光点击")
    banners_month = query_safe(
        provider, audit, "bannerClickData",
        {"startDate": MONTH_START_DATE, "endDate": today}, "Banner曝光点击近30日",
    )
    navigation = query_safe(provider, audit, "customNavigation", {"startDate": today, "endDate": today}, "页面导航曝光点击")
    navigation_month = query_safe(
        provider, audit, "customNavigation", {"startDate": MONTH_START_DATE, "endDate": today}, "页面导航曝光点击近30日",
    )
    navigation_detail = query_safe(provider, audit, "customNavigationDetail", {"startDate": today, "endDate": today}, "页面板块曝光点击")
    navigation_detail_month = query_safe(
        provider, audit, "customNavigationDetail",
        {"startDate": MONTH_START_DATE, "endDate": today}, "页面板块曝光点击近30日",
    )
    source_page_play = query_safe(provider, audit, "sourcePagePlayData", {"startDate": WEEK_START_DATE, "endDate": today}, "来源页播放")
    drama_conversion_week = query_safe(
        provider,
        audit,
        "dramaConversion",
        {"startDate": WEEK_START_DATE, "endDate": today},
        "首页到播放有效播放转化",
    )
    available_play_week = query_safe(
        provider, audit, "availablePlayData",
        {"startDate": WEEK_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "有效播放率近7日",
    )
    search_conversion_week = query_safe(
        provider, audit, "searchClickConversion",
        {"startDate": WEEK_START_DATE, "endDate": today, "clienttype": "android#ios_zyb"},
        "搜索转化近7日",
    )

    # coreData requires a configured password. Never use a sample password or
    # infer user DAU/new users from device metrics.
    clienttype_info = query_safe(
        provider, audit, "getAllClientTypeInfo", {}, "端口维度(client/client_type/application)"
    )
    core_password = os.environ.get("DATA_PROVIDER_CORE_PASSWORD") or os.environ.get(
        "DATA_PROVIDER_PASSWORD"
    )
    core_month = []
    if core_password:
        core_month = query_safe(
            provider,
            audit,
            "coreData",
            {
                "startDate": MONTH_START_DATE,
                "endDate": today,
                "clienttype": "android#ios_zyb",
                "password": core_password,
            },
            "设备日活/新增设备/通用播放率近30日",
        )
    else:
        audit.append({
            "field": "设备日活/新增设备/通用播放率",
            "interface": "coreData",
            "request": {"startDate": MONTH_START_DATE, "endDate": today},
            "return": "未请求",
            "reason": "未配置coreData密码，未使用示例密码或猜测密码",
            "status": "pending",
        })
    audit.append({
        "field": "次日留存率/三日留存率",
        "interface": "data-provider接口清单",
        "request": {"startDate": MONTH_START_DATE, "endDate": today},
        "return": "未发现留存接口",
        "reason": "当前data-provider skill未提供留存接口",
        "status": "pending",
    })

    data["dashboard_date"] = today
    data["generated_at"] = f"{today}T00:00:00+08:00"
    data["source"] = "data-provider补齐｜保留原有已确认字段"
    data["data_provider_audit"] = {"snapshot_date": today, "entries": audit}

    metric_by_key = {
        item["metric_key"]: item
        for item in data["pages"]["overview"]["metric_cards"]
    }
    if watch:
        current = watch[0].get("total_avg_watch_duration")
        old = watch_previous[0].get("total_avg_watch_duration") if watch_previous else None
        if current is not None:
            set_metric(
                metric_by_key["avg_play_time"],
                current,
                "confirmed",
                source("perCapitaWatchDuration", "total_avg_watch_duration"),
                unit="分钟",
                wow=relative_change(current, old),
            )
    if play_count:
        current = play_count[0].get("total_avg_play_count")
        old = (
            play_count_previous[0].get("total_avg_play_count")
            if play_count_previous
            else None
        )
        if current is not None:
            set_metric(
                metric_by_key["avg_play_count"],
                current,
                "confirmed",
                source("perCapitaPlayCount", "total_avg_play_count"),
                wow=relative_change(current, old),
            )

    overview_trends = data["pages"]["overview"].setdefault("trends", {})
    if watch_week:
        watch_rows = [
            {
                "date": row.get("date"),
                "value": row.get("total_avg_watch_duration"),
                "status": "confirmed" if row.get("total_avg_watch_duration") is not None else "pending",
                "source": source("perCapitaWatchDuration", "total_avg_watch_duration", row.get("date") or today),
            }
            for row in sorted(watch_week, key=lambda item: item.get("date") or "")
        ]
        overview_trends["avg_play_time_7d"] = watch_rows
        metric_by_key["avg_play_time"]["trend_30d"] = watch_rows
    if play_count_week:
        play_rows = [
            {
                "date": row.get("date"),
                "value": row.get("total_avg_play_count"),
                "status": "confirmed" if row.get("total_avg_play_count") is not None else "pending",
                "source": source("perCapitaPlayCount", "total_avg_play_count", row.get("date") or today),
            }
            for row in sorted(play_count_week, key=lambda item: item.get("date") or "")
        ]
        overview_trends["avg_play_count_7d"] = play_rows
        metric_by_key["avg_play_count"]["trend_30d"] = play_rows
    if available_play_week:
        overview_trends["available_play_rate_7d"] = [
            {
                "date": row.get("date"),
                "value": row.get("available_play_rate"),
                "status": "confirmed" if row.get("available_play_rate") is not None else "pending",
                "source": source("availablePlayData", "available_play_rate", row.get("date") or today),
            }
            for row in sorted(available_play_week, key=lambda item: item.get("date") or "")
        ]
    if search_conversion_week:
        data["pages"]["search_analysis"]["conversion_trend_7d"] = [
            {
                "date": row.get("date"),
                "search_click_rate": row.get("search_click_rate"),
                "search_complete_rate": row.get("search_complete_rate"),
                "search_long_video_conversion_rate": row.get("search_long_video_conversion_rate"),
                "search_total_conversion_rate": row.get("search_total_conversion_rate"),
                "status": "confirmed",
                "source": source("searchClickConversion", "search_total_conversion_rate", row.get("date") or today),
            }
            for row in sorted(search_conversion_week, key=lambda item: item.get("date") or "")
        ]
    if drama_conversion_week:
        data["pages"]["traffic_analysis"]["home_conversion_7d"] = [
            {
                **row,
                "status": "confirmed",
                "source": source("dramaConversion", "video_uv"),
            }
            for row in sorted(drama_conversion_week, key=lambda item: item.get("date") or "")
        ]

    if watch_month:
        watch_rows_30d = [
            {
                "date": row.get("date"),
                "value": row.get("total_avg_watch_duration"),
                "status": "confirmed" if row.get("total_avg_watch_duration") is not None else "pending",
                "source": source("perCapitaWatchDuration", "total_avg_watch_duration", row.get("date") or today),
            }
            for row in sorted(watch_month, key=lambda item: item.get("date") or "")
        ]
        overview_trends["avg_play_time_30d"] = watch_rows_30d
        metric_by_key["avg_play_time"]["trend_30d"] = watch_rows_30d
    if play_count_month:
        play_rows_30d = [
            {
                "date": row.get("date"),
                "value": row.get("total_avg_play_count"),
                "status": "confirmed" if row.get("total_avg_play_count") is not None else "pending",
                "source": source("perCapitaPlayCount", "total_avg_play_count", row.get("date") or today),
            }
            for row in sorted(play_count_month, key=lambda item: item.get("date") or "")
        ]
        overview_trends["avg_play_count_30d"] = play_rows_30d
        metric_by_key["avg_play_count"]["trend_30d"] = play_rows_30d
    if available_play_month:
        overview_trends["available_play_rate_30d"] = [
            {
                "date": row.get("date"),
                "value": row.get("available_play_rate"),
                "status": "confirmed" if row.get("available_play_rate") is not None else "pending",
                "source": source("availablePlayData", "available_play_rate", row.get("date") or today),
            }
            for row in sorted(available_play_month, key=lambda item: item.get("date") or "")
        ]

    # Growth and playback-quality model. Direct provider fields are retained;
    # unavailable user-level metrics remain explicitly pending.
    def pending_metric(key, reason):
        item = metric_by_key.get(key)
        if item and item.get("value") is None:
            set_metric(item, None, "pending", None)
            item["reason"] = reason

    pending_metric("dau", "data-provider当前仅返回设备日活，用户日活未返回")
    pending_metric("new_users", "data-provider当前仅返回新增设备，新增用户未返回")
    pending_metric("retention_1d", "data-provider未提供次日留存接口")
    pending_metric("retention_3d", "data-provider未提供三日留存接口")
    if "device_dau" not in metric_by_key:
        data["pages"]["overview"]["metric_cards"].append({
            "metric_key": "device_dau", "metric_name": "设备日活", "value": None,
            "unit": "设备", "wow": None, "trend_30d": [], "status": "pending",
            "source": None, "reason": "coreData待接入",
        })
        metric_by_key["device_dau"] = data["pages"]["overview"]["metric_cards"][-1]
    if "new_device" not in metric_by_key:
        data["pages"]["overview"]["metric_cards"].append({
            "metric_key": "new_device", "metric_name": "新增设备", "value": None,
            "unit": "设备", "wow": None, "trend_30d": [], "status": "pending",
            "source": None, "reason": "coreData待接入",
        })
        metric_by_key["new_device"] = data["pages"]["overview"]["metric_cards"][-1]
    if core_month:
        ordered_core = sorted(core_month, key=lambda item: item.get("date") or "")
        for key, field, unit in (("device_dau", "device_dau", "设备"), ("new_device", "new_device", "设备")):
            rows = [{"date": row.get("date"), "value": row.get(field), "status": "confirmed",
                     "source": source("coreData", field, row.get("date") or today)}
                    for row in ordered_core if row.get(field) is not None]
            metric_by_key[key]["trend_30d"] = rows
            latest = next((row for row in reversed(rows) if row.get("date") == today), rows[-1] if rows else None)
            if latest:
                old = rows[-2].get("value") if len(rows) > 1 else None
                set_metric(metric_by_key[key], latest.get("value"), "confirmed", latest.get("source"), unit=unit,
                           wow=relative_change(latest.get("value"), old))
        core_play_rows = [{"date": row.get("date"), "value": row.get("play_rate"), "status": "confirmed",
                           "source": source("coreData", "play_rate", row.get("date") or today)}
                          for row in ordered_core if row.get("play_rate") is not None]
    else:
        core_play_rows = []

    playback_analysis = data["pages"].setdefault("playback_analysis", {})
    drama_rows = sorted(drama_conversion_month, key=lambda item: item.get("date") or "")
    playback_analysis["playback_rate_30d"] = core_play_rows
    playback_analysis["first_frame_play_rate_30d"] = [
        {"date": row.get("date"), "value": row.get("first_frame_play_uv_rate"), "status": "confirmed",
         "source": source("dramaConversion", "first_frame_play_uv_rate", row.get("date") or today)}
        for row in drama_rows if row.get("first_frame_play_uv_rate") is not None
    ]
    playback_analysis["effective_play_rate_30d"] = [
        {"date": row.get("date"), "value": row.get("available_play_rate"), "status": "confirmed",
         "source": source("availablePlayData", "available_play_rate", row.get("date") or today)}
        for row in sorted(available_play_month, key=lambda item: item.get("date") or "")
        if row.get("available_play_rate") is not None
    ]
    playback_analysis["avg_play_count_30d"] = [
        {"date": row.get("date"), "value": row.get("total_avg_play_count"), "status": "confirmed",
         "source": source("perCapitaPlayCount", "total_avg_play_count", row.get("date") or today)}
        for row in sorted(play_count_month, key=lambda item: item.get("date") or "")
        if row.get("total_avg_play_count") is not None
    ]
    playback_analysis["avg_watch_duration_30d"] = [
        {"date": row.get("date"), "value": row.get("total_avg_watch_duration"), "status": "confirmed",
         "source": source("perCapitaWatchDuration", "total_avg_watch_duration", row.get("date") or today)}
        for row in sorted(watch_month, key=lambda item: item.get("date") or "")
        if row.get("total_avg_watch_duration") is not None
    ]
    client_types = [row.get("client_type") for row in clienttype_info if row.get("client_type")]
    playback_analysis["platform_dimensions"] = {
        "available": {"iOS": [x for x in client_types if x.startswith("ios_")],
                       "Android": [x for x in client_types if x.startswith("android")],
                       "M站": [x for x in client_types if x in {"web_applet", "web_pc"}]},
        "fields": ["client", "client_type", "application"],
        "status": "confirmed" if client_types else "pending",
        "source": source("getAllClientTypeInfo", "client_type"),
    }
    if search_conversion_month:
        data["pages"]["search_analysis"]["conversion_trend_30d"] = [
            {
                "date": row.get("date"),
                "search_click_rate": row.get("search_click_rate"),
                "search_complete_rate": row.get("search_complete_rate"),
                "search_long_video_conversion_rate": row.get("search_long_video_conversion_rate"),
                "search_total_conversion_rate": row.get("search_total_conversion_rate"),
                "status": "confirmed",
                "source": source("searchClickConversion", "search_total_conversion_rate", row.get("date") or today),
            }
            for row in sorted(search_conversion_month, key=lambda item: item.get("date") or "")
        ]
    if drama_conversion_month:
        data["pages"]["traffic_analysis"]["home_conversion_30d"] = [
            {**row, "status": "confirmed", "source": source("dramaConversion", "video_uv")}
            for row in sorted(drama_conversion_month, key=lambda item: item.get("date") or "")
        ]
    channel_funnels = []
    channel_trends = {}
    for channel_name, rows in channel_conversion_month.items():
        ordered = sorted(rows, key=lambda item: item.get("date") or "")
        channel_trends[channel_name] = [
            {
                **row,
                "channel": channel_name,
                "status": "confirmed",
                "source": source("dramaConversion", "tab_click_uv", row.get("date") or today),
                "snapshot_date": row.get("date") or today,
            }
            for row in ordered
        ]
        latest = next((row for row in reversed(ordered) if row.get("date") == today), ordered[-1] if ordered else {})
        channel_funnels.append({
            "channel": channel_name,
            "tab_click_uv": latest.get("tab_click_uv"),
            "content_click_uv": latest.get("content_click_uv"),
            "content_click_uv_rate": latest.get("content_click_uv_rate"),
            "detail_play_start_uv": latest.get("detail_play_start_uv"),
            "first_frame_play_uv_rate": latest.get("first_frame_play_uv_rate"),
            "detail_play_5_mins_uv": latest.get("detail_play_5_mins_uv"),
            "play_5_mins_uv_rate": latest.get("play_5_mins_uv_rate"),
            "video_uv": latest.get("video_uv"),
            "video_uv_rate": latest.get("video_uv_rate"),
            "detail_play_10_mins_uv": latest.get("detail_play_10_mins_uv"),
            "detail_play_10_mins_uv_rate": latest.get("detail_play_10_mins_uv_rate"),
            "avg_video_time": latest.get("avg_video_time"),
            "date": latest.get("date") or today,
            "status": "confirmed" if latest else "pending",
            "source": source("dramaConversion", "tab_click_uv", latest.get("date") or today),
            "snapshot_date": latest.get("date") or today,
        })
    data["pages"]["traffic_analysis"]["channel_funnels"] = channel_funnels
    data["pages"]["traffic_analysis"]["channel_conversion_30d"] = channel_trends
    if source_page_play_month:
        data["pages"]["traffic_analysis"]["source_page_play_30d"] = [
            {
                "source_page": row.get("source_page"),
                "play_count": row.get("play_count"),
                "status": "confirmed" if row.get("play_count") is not None else "pending",
                "source": source("sourcePagePlayData", "play_count"),
            }
            for row in source_page_play_month
        ]
    if genre_month:
        genre_dates = {}
        for row in genre_month:
            genre_dates.setdefault(row.get("date"), []).append(row)
        genre_history = []
        for day, rows in sorted(genre_dates.items()):
            total = sum((row.get("play_vv") or 0) for row in rows)
            for row in rows:
                value = row.get("play_vv")
                genre_history.append({
                    "date": day,
                    "genre": row.get("season_type"),
                    "play_count": value,
                    "share": value / total if value is not None and total else None,
                    "status": "calculated" if value is not None and total else "pending",
                    "source": source("seasonTypePlayRatio", "play_vv", day),
                })
        data["pages"]["content_analysis"]["genre_play_share_30d"] = genre_history

    type_names = {
        "CHN": "国产剧",
        "JP": "日剧",
        "KR": "韩剧",
        "OTHER": "其他",
        "TH": "泰剧",
        "UK": "英剧",
        "USK": "美剧",
        "movie": "电影",
    }
    genre_by_date = {}
    for row in genre:
        genre_by_date.setdefault(row["date"], {})[row["season_type"]] = row
    current_genre = genre_by_date.get(today, {})
    previous_genre = genre_by_date.get(previous, {})
    current_total = sum(row.get("play_vv") or 0 for row in current_genre.values())
    previous_total = sum(row.get("play_vv") or 0 for row in previous_genre.values())
    genre_rows = []
    for season_type, name in type_names.items():
        current_row = current_genre.get(season_type)
        previous_row = previous_genre.get(season_type)
        play_vv = current_row.get("play_vv") if current_row else None
        old_vv = previous_row.get("play_vv") if previous_row else None
        share = play_vv / current_total if play_vv is not None and current_total else None
        old_share = old_vv / previous_total if old_vv is not None and previous_total else None
        genre_rows.append(
            {
                "genre_group": name,
                "play_count": play_vv,
                "share": share,
                "day_change": share - old_share if share is not None and old_share is not None else None,
                "status": "calculated" if play_vv is not None else "pending",
                "source": source("seasonTypePlayRatio", "play_vv"),
                "reason": None if play_vv is not None else "data-provider未返回该剧种数据",
            }
        )
    data["pages"]["content_analysis"]["genre_play_share"] = genre_rows

    previous_play = {
        row.get("title"): row.get("play_count")
        for row in hot_play_previous
        if row.get("title")
    }
    previous_top30 = sorted(
        hot_play_previous,
        key=lambda item: item.get("play_count") or 0,
        reverse=True,
    )[:30]
    previous_titles = {
        row.get("title")
        for row in previous_top30
        if row.get("title")
    }
    hot_play_rows = []
    for rank, row in enumerate(
        sorted(hot_play, key=lambda item: item.get("play_count") or 0, reverse=True)[:30],
        start=1,
    ):
        title = row.get("title")
        play_value = row.get("play_count")
        old_value = previous_play.get(title)
        hot_play_rows.append(
            {
                "date": today,
                "rank": rank,
                "title": title,
                "season_name": title,
                "play_count": play_value,
                "play_vv": play_value,
                "play_uv": None,
                "day_change": relative_change(play_value, old_value),
                "change_rate": relative_change(play_value, old_value),
                "country_region": row.get("producer_region"),
                "country": row.get("producer_region"),
                "content_type": row.get("season_classify"),
                "genre": row.get("plot_type"),
                "season_type": row.get("season_type"),
                "tags": row.get("plot_type"),
                "is_new_entry": title not in previous_titles,
                "is_new_rank": title not in previous_titles,
                "status": "pending" if row.get("play_count") is None else "calculated",
                "source": source("seasonPlayVV", "play_count"),
                "reason": "pending field: play_uv" if row.get("play_count") is not None else "pending field: play_vv",
            }
        )
    data["pages"]["content_analysis"]["hot_play_top30"] = hot_play_rows

    def map_play_top10(rows, previous_rows, command="playTop10"):
        previous_vv = {
            row.get("name"): row.get("vv")
            for row in previous_rows
            if row.get("name")
        }
        mapped = []
        for rank, row in enumerate(rows, start=1):
            title = row.get("name")
            play_value = row.get("vv")
            old_value = previous_vv.get(title)
            metadata_rows = query_safe(
                provider,
                audit,
                "seasonPlayVV",
                {"startDate": today, "endDate": today, "title": title},
                f"新用户榜属性:{title}",
            ) if title else []
            metadata = next(
                (item for item in metadata_rows if item.get("title") == title),
                {},
            )
            change = relative_change(play_value, old_value)
            missing_fields = ["play_uv"]
            if change is None:
                missing_fields.append("change_rate")
            # playTop10 cannot confirm whether a title first entered a Top30 rank.
            is_new_rank = False if old_value is not None else None
            if is_new_rank is None:
                missing_fields.append("is_new_rank")
            mapped.append({
                "rank": rank,
                "title": title,
                "season_name": title,
                "play_count": play_value,
                "play_vv": play_value,
                "play_uv": None,
                "day_change": change,
                "change_rate": change,
                "country_region": metadata.get("producer_region"),
                "country": metadata.get("producer_region"),
                "season_type": metadata.get("season_type"),
                "content_type": metadata.get("season_classify") or row.get("video_type"),
                "genre": metadata.get("plot_type"),
                "tags": metadata.get("plot_type"),
                "is_new_entry": is_new_rank,
                "is_new_rank": is_new_rank,
                "status": "partial" if play_value is not None else "pending",
                "source": source(command, "vv"),
                "reason": "playTop10仅返回新用户Top10；播放UV未返回；Top30新入榜标记无法由Top10确认",
                "missing_fields": missing_fields,
            })
        return mapped

    play_top10 = query_safe(
        provider,
        audit,
        "playTop10",
        {"date": today.replace("-", "")},
        "热播榜总榜/新用户榜Top10",
    )
    play_top10_previous = query_safe(
        provider,
        audit,
        "playTop10",
        {"date": previous.replace("-", "")},
        "新用户榜昨日Top10",
    )
    if play_top10:
        data["pages"]["content_analysis"]["hot_play_top10_segments"] = {
            "total": hot_play_rows,
            "new_user": map_play_top10(
                play_top10.get("season_new_user_top10", []),
                play_top10_previous.get("season_new_user_top10", [])
                if isinstance(play_top10_previous, dict) else [],
            ),
            "new_added": [],
        }
        audit.append({
            "field": "新增用户榜Top30",
            "interface": "playTop10",
            "request": {"date": today.replace("-", "")},
            "return": "未提供新增用户榜",
            "reason": "接口仅返回season_top10和season_new_user_top10，无新增用户榜字段",
            "status": "pending",
        })

    previous_words = {
        row.get("words"): row.get("counts")
        for row in hot_words_previous
        if row.get("words")
    }
    hot_search_rows = []
    for rank, row in enumerate(hot_words[:30], start=1):
        keyword = row.get("words")
        count = row.get("counts")
        hot_search_rows.append(
            {
                "rank": rank,
                "keyword": keyword,
                "search_count": count,
                "search_uv": None,
                "day_change": relative_change(count, previous_words.get(keyword)),
                "content_type": None,
                "genre": None,
                "user_type": None,
                "status": "pending" if count is not None else "pending",
                "source": source("allDeviceHotWords", "counts"),
                "confirmed_fields": ["rank", "keyword", "search_count"],
                "reason": "data-provider未返回搜索UV、内容标签和用户类型",
            }
        )
    data["pages"]["search_analysis"]["hot_search_top30"] = hot_search_rows

    def map_hot_words(rows, user_type, previous_map):
        result = []
        for rank, row in enumerate(rows[:30], start=1):
            keyword = row.get("words")
            count = row.get("counts")
            result.append({
                "rank": rank,
                "keyword": keyword,
                "search_count": count,
                "search_uv": None,
                "day_change": relative_change(count, previous_map.get(keyword)),
                "content_type": None,
                "genre": None,
                "user_type": user_type,
                "status": "pending" if count is None else "calculated",
                "source": source("newDeviceHotWords", "counts"),
                "confirmed_fields": ["rank", "keyword", "search_count", "user_type"],
                "reason": "data-provider未返回搜索UV、内容标签",
            })
        return result

    new_previous_words = {
        row.get("words"): row.get("counts")
        for row in new_hot_words_previous
        if row.get("words")
    }
    if new_hot_words:
        data["pages"]["search_analysis"]["hot_search_top30_new"] = map_hot_words(
            new_hot_words, "new", new_previous_words
        )
    else:
        data["pages"]["search_analysis"]["hot_search_top30_new"] = []
    audit.append({
        "field": "热搜榜老用户Top30",
        "interface": "oldDeviceHotWords",
        "request": {"date": today},
        "return": "未查询到对应接口",
        "reason": "skill未提供老用户热词接口；allDeviceHotWords仅为全体用户",
        "status": "pending",
    })

    section_rows = []
    for row in sections:
        section_rows.append(
            {
                "date": row.get("date") or today,
                "group_name": row.get("group_name"),
                "section_name": row.get("group_name"),
                "exposure_count": row.get("exposure_count"),
                "exposure_pv": row.get("exposure_count"),
                "exposure_user": row.get("exposure_user"),
                "exposure_uv": row.get("exposure_user"),
                "click_count": row.get("click_count"),
                "click_user": row.get("click_user"),
                "ctr_pv": row.get("ctr_pv"),
                "ctr_uv": row.get("ctr_uv"),
                "confirmed_fields": [
                    "group_name", "exposure_count", "exposure_user", "click_count",
                    "click_user", "ctr_pv", "ctr_uv",
                ],
                "play_count": None,
                "effective_play_count": None,
                "conversion_rate": None,
                "status": "pending",
                "source": source("sectionData", "exposure_count"),
                "reason": "data-provider未返回板块播放和有效播放",
                "channel": row.get("channel"),
                "snapshot_date": row.get("date") or today,
            }
        )
    if section_rows:
        data["pages"]["traffic_analysis"]["home_sections"] = section_rows
    data["pages"]["traffic_analysis"]["home_sections_30d"] = [
        {
            "date": row.get("date") or today,
            "group_name": row.get("group_name"),
            "section_name": row.get("group_name"),
            "exposure_count": row.get("exposure_count"),
            "exposure_pv": row.get("exposure_count"),
            "exposure_user": row.get("exposure_user"),
            "exposure_uv": row.get("exposure_user"),
            "click_count": row.get("click_count"),
            "click_user": row.get("click_user"),
            "ctr_pv": row.get("ctr_pv"),
            "ctr_uv": row.get("ctr_uv"),
            "status": "confirmed",
            "source": source("sectionData", "exposure_count", row.get("date") or today),
            "snapshot_date": row.get("date") or today,
        }
        for row in sorted(sections_month, key=lambda item: (item.get("date") or "", item.get("group_name") or ""))
    ]
    data["pages"]["traffic_analysis"]["navigation_pages"] = [
        {
            **row,
            "status": "confirmed",
            "source": source("customNavigation", "page_exposure_pv"),
        }
        for row in navigation
    ]
    data["pages"]["traffic_analysis"]["navigation_details"] = [
        {
            **row,
            "status": "confirmed",
            "source": source("customNavigationDetail", "exposure_pv"),
        }
        for row in navigation_detail
    ]
    data["pages"]["traffic_analysis"]["navigation_pages_30d"] = [
        {
            **row,
            "status": "confirmed",
            "source": source("customNavigation", "page_exposure_pv", row.get("date") or today),
            "snapshot_date": row.get("date") or today,
        }
        for row in sorted(navigation_month, key=lambda item: item.get("date") or "")
    ]
    data["pages"]["traffic_analysis"]["navigation_details_30d"] = [
        {
            **row,
            "status": "confirmed",
            "source": source("customNavigationDetail", "exposure_pv", row.get("date") or today),
            "snapshot_date": row.get("date") or today,
        }
        for row in sorted(navigation_detail_month, key=lambda item: item.get("date") or "")
    ]
    data["pages"]["traffic_analysis"]["component_effects"] = [
        {
            "component_type": "Banner",
            "model_name": row.get("title"),
            "exposure_pv": row.get("vv_expose_count"),
            "exposure_uv": row.get("uv_expose_count"),
            "click_pv": row.get("vv_click_count"),
            "click_uv": row.get("uv_click_count"),
            "ctr_pv": row.get("ctr_pv"),
            "ctr_uv": row.get("ctr_uv"),
            "position_id": row.get("position_id"),
            "banner_position": row.get("banner_position"),
            "clienttype": row.get("clienttype"),
            "date": row.get("date") or today,
            "status": "confirmed",
            "source": source("bannerClickData", "uv_expose_count", row.get("date") or today),
            "snapshot_date": row.get("date") or today,
        }
        for row in banners
    ]
    data["pages"]["traffic_analysis"]["component_effects_30d"] = [
        {
            "component_type": "Banner",
            "model_name": row.get("title"),
            "exposure_pv": row.get("vv_expose_count"),
            "exposure_uv": row.get("uv_expose_count"),
            "click_pv": row.get("vv_click_count"),
            "click_uv": row.get("uv_click_count"),
            "ctr_pv": row.get("ctr_pv"),
            "ctr_uv": row.get("ctr_uv"),
            "position_id": row.get("position_id"),
            "banner_position": row.get("banner_position"),
            "clienttype": row.get("clienttype"),
            "date": row.get("date") or today,
            "status": "confirmed",
            "source": source("bannerClickData", "uv_expose_count", row.get("date") or today),
            "snapshot_date": row.get("date") or today,
        }
        for row in sorted(banners_month, key=lambda item: (item.get("date") or "", item.get("title") or ""))
    ]
    data["pages"]["traffic_analysis"]["component_pending"] = [
        {"component_type": "弹窗", "status": "pending", "source": None, "snapshot_date": today},
        {"component_type": "猜你喜欢", "status": "pending", "source": None, "snapshot_date": today},
    ]
    data["pages"]["traffic_analysis"]["source_page_play_7d"] = [
        {
            "source_page": row.get("source_page"),
            "play_count": row.get("play_count"),
            "status": "confirmed" if row.get("play_count") is not None else "pending",
            "source": source("sourcePagePlayData", "play_count"),
            "reason": None if row.get("play_count") is not None else "接口未返回播放量",
        }
        for row in source_page_play
    ]
    audit.extend([
        {
            "field": "页面流量桑基边",
            "interface": "customNavigation/customNavigationDetail/sourcePagePlayData",
            "request": {"startDate": WEEK_START_DATE, "endDate": today},
            "return": "节点与聚合播放可用，source-target-value边不可用",
            "reason": "接口未返回完整来源节点关系及有效播放关联",
            "status": "pending",
        },
        {
            "field": "播放UV",
            "interface": "seasonPlayVV/playTop10",
            "request": {"startDate": today, "endDate": today},
            "return": "未返回play_uv",
            "reason": "返回结构仅包含play_count或vv",
            "status": "pending",
        },
    ])

    existing_banners = data["pages"]["recommendation_analysis"]["banners"]
    for item in existing_banners:
        title = item.get("title")
        matches = [row for row in banners if row.get("title") == title]
        positions = {row.get("banner_position") for row in matches}
        if len(positions) == 1:
            item["position"] = next(iter(positions))
            item["source"] = source("bannerClickData", "banner_position")
            item["status"] = "pending"
            item["reason"] = "data-provider未返回Banner播放和有效播放"

    tmp_path = DATA_PATH.with_suffix(".json.tmp")
    with tmp_path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    tmp_path.replace(DATA_PATH)

    print(
        json.dumps(
            {
                "snapshot_date": SNAPSHOT_DATE,
                "metrics": len(metric_by_key),
                "genre_rows": len(genre_rows),
                "hot_play_rows": len(hot_play_rows),
                "hot_search_rows": len(hot_search_rows),
                "home_section_rows": len(section_rows),
                "banner_rows_checked": len(banners),
                "week_start_date": WEEK_START_DATE,
                "month_start_date": MONTH_START_DATE,
                "watch_week_rows": len(watch_week),
                "watch_month_rows": len(watch_month),
                "play_count_week_rows": len(play_count_week),
                "play_count_month_rows": len(play_count_month),
                "available_play_week_rows": len(available_play_week),
                "available_play_month_rows": len(available_play_month),
                "search_conversion_week_rows": len(search_conversion_week),
                "search_conversion_month_rows": len(search_conversion_month),
                "navigation_rows": len(navigation),
                "navigation_detail_rows": len(navigation_detail),
                "source_page_play_rows": len(source_page_play),
                "source_page_play_month_rows": len(source_page_play_month),
                "drama_conversion_week_rows": len(drama_conversion_week),
                "drama_conversion_month_rows": len(drama_conversion_month),
                "audit_entries": len(audit),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
