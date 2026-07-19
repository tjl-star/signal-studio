"""Stage 3: score videos and build the operations snapshot and report."""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

from common import DATA_DIR, ROOT, read_csv, safe_float, safe_int, setup_logging, utc_now, write_csv
from content_classifier import CONTENT_TYPES, classify_content


INPUT_CSV = DATA_DIR / "final" / "youtube_tmdb_merged.csv"
TMDB_CSV = DATA_DIR / "clean" / "tmdb_titles.csv"
OUTPUT_CSV = DATA_DIR / "final" / "content_recommendations.csv"
OUTPUT_MD = ROOT / "docs" / "content_recommendations.md"
DASHBOARD_JSON = ROOT / "dashboard_web" / "src" / "dashboard-data.json"


def hours_since(value: str) -> float:
    try:
        published = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return max(1.0, (datetime.now(timezone.utc) - published).total_seconds() / 3600)
    except (ValueError, TypeError):
        return 720.0


def normalize(values: list[float]) -> list[float]:
    low, high = min(values, default=0), max(values, default=0)
    if high <= low:
        return [0.5 for _ in values]
    return [(value - low) / (high - low) for value in values]


def recommendation(row: dict) -> str:
    if row["engagement_rate"] >= 0.06:
        return "高互动：复盘标题、封面和粉丝讨论点，适合制作社区互动内容。"
    if row["views_per_hour"] >= 10000:
        return "增长快：优先跟进同一IP、演员或物料发布节点。"
    if row["tmdb_popularity"] >= 50:
        return "IP热度较高：可结合剧集资料制作人物、剧情或观看指南。"
    return "持续观察：等待更多播放和互动样本后再决定是否跟进。"


def run(input_csv: Path = INPUT_CSV) -> Path:
    logger = setup_logging("analysis")
    source = read_csv(input_csv)
    tmdb_lookup = {str(item.get("tmdb_id", "")).strip(): item for item in read_csv(TMDB_CSV) if str(item.get("tmdb_id", "")).strip()}
    rows: list[dict] = []
    for item in source:
        tmdb_item = tmdb_lookup.get(str(item.get("tmdb_id", "")).strip(), {})
        if tmdb_item:
            for key, value in tmdb_item.items():
                if key != "query" and value and not item.get(f"tmdb_{key}"):
                    item[f"tmdb_{key}"] = value
        views = safe_int(item.get("view_count"))
        likes = safe_int(item.get("like_count"))
        comments = safe_int(item.get("comment_count"))
        age_hours = hours_since(item.get("published_at", ""))
        classification = classify_content(item)
        rows.append({
            **item,
            **classification,
            "views": views,
            "likes": likes,
            "comments": comments,
            "age_hours": round(age_hours, 2),
            "views_per_hour": round(views / age_hours, 2),
            "engagement_rate": round((likes + comments) / views, 6) if views else 0,
            "comment_rate": round(comments / views, 6) if views else 0,
            "freshness": round(math.exp(-age_hours / 336), 6),
            "tmdb_popularity": safe_float(item.get("tmdb_popularity")),
            "tmdb_vote_average": safe_float(item.get("tmdb_vote_average")),
        })
    metrics = {
        "views": normalize([math.log1p(row["views"]) for row in rows]),
        "engagement": normalize([row["engagement_rate"] for row in rows]),
        "comments": normalize([row["comment_rate"] for row in rows]),
        "freshness": normalize([row["freshness"] for row in rows]),
        "tmdb_popularity": normalize([row["tmdb_popularity"] for row in rows]),
        "tmdb_vote": normalize([row["tmdb_vote_average"] for row in rows]),
    }
    for index, row in enumerate(rows):
        score = (
            metrics["views"][index] * 0.30
            + metrics["engagement"][index] * 0.20
            + metrics["comments"][index] * 0.10
            + metrics["freshness"][index] * 0.15
            + metrics["tmdb_popularity"][index] * 0.15
            + metrics["tmdb_vote"][index] * 0.10
        ) * 100
        row["heat_score"] = round(score, 2)
        row["recommendation"] = recommendation(row)
    rows.sort(key=lambda row: row["heat_score"], reverse=True)
    for rank, row in enumerate(rows, 1):
        row["rank"] = rank
    output_fields = (
        ["rank", "heat_score", "recommendation"]
        + [key for key in rows[0] if key not in {"rank", "heat_score", "recommendation"}]
        if rows else []
    )
    write_csv(OUTPUT_CSV, rows, output_fields)
    write_markdown(rows)
    write_dashboard(rows)
    logger.info("第三阶段完成：分析视频=%s，推荐表=%s，看板快照=%s", len(rows), OUTPUT_CSV, DASHBOARD_JSON)
    return OUTPUT_CSV


def write_markdown(rows: list[dict]) -> None:
    OUTPUT_MD.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# 内容热度与选题建议",
        "",
        f"生成时间：{utc_now()}",
        "",
        "评分由播放量、互动率、评论率、新鲜度、TMDb热度和评分加权得到，"
        "仅用于竞品筛选，不代表平台官方热榜。",
        "",
        "| 排名 | 视频 | 频道 | 类型 | 热度分 | 建议 |",
        "|---:|---|---|---|---:|---|",
    ]
    for row in rows[:20]:
        title = str(row.get("title", "")).replace("|", "\\|")
        lines.append(
            f"| {row['rank']} | [{title}]({row.get('video_url', '')}) | {row.get('channel_title', '')} | "
            f"{row.get('content_type_label', '其他')} | {row['heat_score']:.2f} | {row['recommendation']} |"
        )
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _video_payload(row: dict) -> dict:
    facts = [
        f"累计播放量：{row['views']:,}",
        f"每小时播放量：{row['views_per_hour']:,.0f}",
        f"互动率：{row['engagement_rate'] * 100:.2f}%",
        f"评论率：{row['comment_rate'] * 100:.3f}%",
        f"TMDb热度：{row['tmdb_popularity']:.1f}",
    ]
    return {
        "rank": row["rank"],
        "platform": row.get("platform", "youtube"),
        "video_id": row.get("video_id", ""),
        "title": row.get("title", ""),
        "description": row.get("description", ""),
        "tags": row.get("tags", ""),
        "duration": row.get("duration", ""),
        "content_type": row.get("content_type", "other"),
        "content_type_label": row.get("content_type_label", "其他"),
        "classification_method": row.get("classification_method", "rule:no_match"),
        "classification_confidence": safe_float(row.get("classification_confidence")),
        "channel_title": row.get("channel_title", ""),
        "published_at": row.get("published_at", ""),
        "video_url": row.get("video_url", ""),
        "thumbnail_fallback": row.get("thumbnail_url", ""),
        "views": row["views"],
        "likes": row["likes"],
        "comments": row["comments"],
        "views_per_hour": row["views_per_hour"],
        "engagement_rate": row["engagement_rate"],
        "views_per_subscriber": (
            row["views"] / safe_int(row.get("subscriber_count")) if safe_int(row.get("subscriber_count")) else 0
        ),
        "heat_score": row["heat_score"],
        "recommendation": row["recommendation"],
        "tmdb_title": row.get("tmdb_title", ""),
        "tmdb_id": row.get("tmdb_id", ""),
        "tmdb_media_type": row.get("tmdb_media_type", ""),
        "tmdb_popularity": row["tmdb_popularity"],
        "tmdb_vote_average": row["tmdb_vote_average"],
        "tmdb_poster_url": row.get("tmdb_poster_url", ""),
        "tmdb_overview": row.get("tmdb_overview", ""),
        "channel_handle": row.get("channel_handle", ""),
        "subscriber_count": safe_int(row.get("subscriber_count")),
        "age_hours": row["age_hours"],
        "facts": facts,
        "hypotheses": [row["recommendation"], "建议结合评论内容、发布时间和地区趋势继续验证。"],
    }


def write_dashboard(rows: list[dict]) -> None:
    top = rows[:10]
    videos = [_video_payload(row) for row in rows]

    channel_map: dict[str, dict] = {}
    for row in rows:
        key = row.get("channel_title") or "未知频道"
        item = channel_map.setdefault(key, {
            "channel_title": key,
            "channel_handle": row.get("channel_handle", ""),
            "subscriber_count": safe_int(row.get("subscriber_count")),
            "video_count": 0,
            "total_views": 0,
            "total_likes": 0,
            "total_comments": 0,
            "heat_total": 0.0,
        })
        item["video_count"] += 1
        item["total_views"] += row["views"]
        item["total_likes"] += row["likes"]
        item["total_comments"] += row["comments"]
        item["heat_total"] += row["heat_score"]
    channels = []
    for item in channel_map.values():
        item["avg_heat_score"] = round(item.pop("heat_total") / item["video_count"], 2)
        item["engagement_rate"] = round(
            (item["total_likes"] + item["total_comments"]) / item["total_views"], 6
        ) if item["total_views"] else 0
        channels.append(item)
    channels.sort(key=lambda item: item["total_views"], reverse=True)

    title_map: dict[str, dict] = {}
    for row in rows:
        tmdb_id = str(row.get("tmdb_id", "")).strip()
        if not tmdb_id:
            continue
        item = title_map.setdefault(tmdb_id, {
            "tmdb_id": tmdb_id,
            "title": row.get("tmdb_title", ""),
            "original_title": row.get("tmdb_original_title", ""),
            "media_type": row.get("tmdb_media_type", ""),
            "release_date": row.get("tmdb_release_date", ""),
            "genres": row.get("tmdb_genres", ""),
            "origin_countries": row.get("tmdb_origin_countries", ""),
            "original_language": row.get("tmdb_original_language", ""),
            "cast_names": row.get("tmdb_cast", ""),
            "creators": row.get("tmdb_creators", ""),
            "popularity": row["tmdb_popularity"],
            "vote_average": row["tmdb_vote_average"],
            "vote_count": safe_int(row.get("tmdb_vote_count")),
            "poster_url": row.get("tmdb_poster_url", ""),
            "overview": row.get("tmdb_overview", ""),
            "video_count": 0,
            "total_views": 0,
            "best_heat_score": 0.0,
            "channel_titles": [],
        })
        item["video_count"] += 1
        item["total_views"] += row["views"]
        item["best_heat_score"] = max(item["best_heat_score"], row["heat_score"])
        if row.get("channel_title") and row["channel_title"] not in item["channel_titles"]:
            item["channel_titles"].append(row["channel_title"])
    titles = sorted(title_map.values(), key=lambda item: (item["best_heat_score"], item["popularity"]), reverse=True)

    daily_map: dict[str, dict] = {}
    for row in rows:
        day = row.get("published_at", "")[:10] or "未知"
        point = daily_map.setdefault(day, {"date": day, "video_count": 0, "total_views": 0, "avg_heat_score": 0.0})
        point["video_count"] += 1
        point["total_views"] += row["views"]
        point["avg_heat_score"] += row["heat_score"]
    daily = []
    for point in daily_map.values():
        point["avg_heat_score"] = round(point["avg_heat_score"] / point["video_count"], 2)
        daily.append(point)
    daily.sort(key=lambda point: point["date"])

    generated_at = utc_now()
    total_views = sum(row["views"] for row in rows)
    payload = {
        "code": 0,
        "message": "success",
        "schema_version": "2.0",
        "public_snapshot": True,
        "generated_at": generated_at,
        "target_date": datetime.now().date().isoformat(),
        "scope": "海外影视竞品频道最近公开视频快照",
        "source": "YouTube Data API v3 + TMDb API",
        "ranking_metric": "综合热度分",
        "source_candidate_count": len(rows),
        "yesterday_candidate_count": sum(row["age_hours"] <= 48 for row in rows),
        "total_views": sum(row["views"] for row in top),
        "avg_views_per_hour": sum(row["views_per_hour"] for row in top) / len(top) if top else 0,
        "all_video_views": total_views,
        "all_video_engagement_rate": round(
            sum(row["likes"] + row["comments"] for row in rows) / total_views, 6
        ) if total_views else 0,
        "mapped_video_count": sum(bool(str(row.get("tmdb_id", "")).strip()) for row in rows),
        "channels": channels,
        "titles": titles,
        "daily": daily,
        "videos": videos,
        "content_types": [{"value": key, "label": value} for key, value in CONTENT_TYPES.items()],
        "data_sources": [
            {"name": "YouTube Data API v3", "status": "正常", "records": len(rows), "last_snapshot": generated_at, "role": "频道、视频与互动指标"},
            {"name": "TMDb API", "status": "正常", "records": len(titles), "last_snapshot": generated_at, "role": "影视资料、评分与热度"},
            {"name": "人工审核映射", "status": "正常", "records": len(titles), "last_snapshot": generated_at, "role": "视频标题与影视项目实体对齐"},
        ],
        "metric_definitions": [
            {"name": "综合热度分", "definition": "播放量30% + 互动率20% + 评论率10% + 新鲜度15% + TMDb热度15% + TMDb评分10%"},
            {"name": "互动率", "definition": "(点赞数 + 评论数) / 播放量"},
            {"name": "每小时播放", "definition": "采集时累计播放量 / 发布后经过小时数"},
            {"name": "内容类型", "definition": "基于标题、描述、标签和视频时长的可解释规则分类"},
        ],
        "caveats": [
            "这是采集时点的数据快照，并非实时数据。",
            "综合热度分是作品集中的运营筛选指标，不是平台官方排名。",
            "内容类型为规则识别，低置信度结果需要运营人员复核。",
            "前端不携带API Key，所有真实请求由Python后端完成。",
            "This product uses the TMDB API but is not endorsed or certified by TMDB.",
        ],
    }
    DASHBOARD_JSON.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="计算内容热度并生成运营建议")
    parser.add_argument("--input", type=Path, default=INPUT_CSV)
    args = parser.parse_args()
    try:
        run(args.input)
        return 0
    except Exception as error:
        setup_logging("analysis").exception("第三阶段失败：%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
