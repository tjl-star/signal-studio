"""Create the shareable CSV and Markdown outputs for Signal Studio."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from common import DATA_DIR, ROOT, utc_now
from database import query_all


EXPORT_DIR = DATA_DIR / "exports"
VIDEOS_CSV = EXPORT_DIR / "videos.csv"
RECOMMENDATIONS_CSV = EXPORT_DIR / "recommendations.csv"
REPORT_MD = EXPORT_DIR / "operations_report.md"


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(rows[0]) if rows else ["message"]
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        if rows:
            writer.writerows(rows)


def generate_exports() -> dict[str, Path]:
    videos = query_all(
        """SELECT v.platform,v.video_id,v.channel_title,v.video_url,v.title,v.content_type,
                  v.published_at,v.latest_view_count AS views,v.latest_like_count AS likes,
                  v.latest_comment_count AS comments,v.heat_score,v.recommendation,
                  t.tmdb_id,t.title AS tmdb_title,t.popularity AS tmdb_popularity,
                  t.vote_average AS tmdb_vote_average
           FROM videos v
           LEFT JOIN video_tmdb_links l ON l.platform=v.platform AND l.video_id=v.video_id
           LEFT JOIN tmdb_titles t ON t.tmdb_id=l.tmdb_id
           ORDER BY COALESCE(v.heat_score,0) DESC"""
    )
    recommendations = [row for row in videos if float(row.get("heat_score") or 0) >= 50][:20]
    _write_csv(VIDEOS_CSV, videos)
    _write_csv(RECOMMENDATIONS_CSV, recommendations)

    totals = query_all(
        """SELECT COUNT(*) AS video_count,COUNT(DISTINCT channel_id) AS channel_count,
                  COALESCE(SUM(latest_view_count),0) AS total_views,
                  COALESCE(SUM(latest_like_count+latest_comment_count),0) AS interactions
           FROM videos"""
    )[0]
    lines = [
        "# 海外影视内容运营报告",
        "",
        f"生成时间：{utc_now()}",
        "",
        "## 数据概览",
        "",
        f"- 监测频道：{totals['channel_count']}",
        f"- 视频数量：{totals['video_count']}",
        f"- 累计播放：{totals['total_views']:,}",
        f"- 点赞与评论：{totals['interactions']:,}",
        "",
        "## 优先跟进内容",
        "",
        "| 排名 | 视频 | 频道 | 类型 | 热度 | 建议 |",
        "|---:|---|---|---|---:|---|",
    ]
    for index, row in enumerate(recommendations[:10], 1):
        title = str(row.get("title") or "").replace("|", "\\|")
        suggestion = str(row.get("recommendation") or "").replace("|", "\\|")
        lines.append(
            f"| {index} | [{title}]({row.get('video_url') or ''}) | {row.get('channel_title') or ''} | "
            f"{row.get('content_type') or 'other'} | {float(row.get('heat_score') or 0):.1f} | {suggestion} |"
        )
    lines.extend([
        "",
        "> 热度分为作品集内部筛选指标，不代表YouTube或TMDb官方排名。",
        "",
        "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    ])
    REPORT_MD.parent.mkdir(parents=True, exist_ok=True)
    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"videos": VIDEOS_CSV, "recommendations": RECOMMENDATIONS_CSV, "report": REPORT_MD}
