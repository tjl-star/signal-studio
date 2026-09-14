"""FastAPI service for the Signal Studio operations workbench."""

from __future__ import annotations

import json
import re
import threading
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from ai_service import generate_brief
from common import LOG_PATH, ROOT, utc_now
from content_classifier import CONTENT_TYPES
from database import DB_PATH, init_db, query_all, start_run
from export_service import REPORT_MD, RECOMMENDATIONS_CSV, VIDEOS_CSV, generate_exports
from fetch_youtube import read_handles
from run_pipeline import execute as execute_pipeline


app = FastAPI(title="Signal Studio API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

LOCAL_HOSTS = {"127.0.0.1", "::1", "localhost", "testclient"}
TASK_THREADS: dict[str, threading.Thread] = {}
RANKING_DATA_DIR = ROOT / "dashboard-v2" / "data" / "season_play_daily"
RANKING_TITLE_MAP = ROOT / "dashboard-v2" / "data" / "season_title_map.json"


def ok(data: Any, message: str = "success") -> dict[str, Any]:
    return {"code": 0, "message": message, "data": data}


def parse_json(value: str | None, fallback: Any) -> Any:
    try:
        return json.loads(value or "")
    except (TypeError, json.JSONDecodeError):
        return fallback


def _date_range(start_date: str, end_date: str) -> list[str]:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    if start > end:
        raise HTTPException(status_code=400, detail="开始日期不能晚于结束日期")
    if (end - start).days > 92:
        raise HTTPException(status_code=400, detail="日期区间不能超过93天")
    return [(start + timedelta(days=offset)).isoformat() for offset in range((end - start).days + 1)]


@lru_cache(maxsize=1)
def _season_title_map() -> dict[str, str]:
    if not RANKING_TITLE_MAP.exists():
        return {}
    payload = json.loads(RANKING_TITLE_MAP.read_text(encoding="utf-8"))
    return {str(row.get("season_id")): str(row.get("title") or "--") for row in payload if row.get("season_id")}


@lru_cache(maxsize=128)
def _season_day(date: str) -> list[dict[str, Any]]:
    path = RANKING_DATA_DIR / f"{date}.json"
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("rows", []) if isinstance(payload, dict) else []


def _aggregate_season_days(dates: list[str]) -> list[dict[str, Any]]:
    # The daily snapshot is the atomic VV grain. If an upstream response ever
    # contains duplicate rows for one season on the same day, keep the largest
    # slice for that day instead of silently double-counting it.
    by_day: dict[tuple[str, str], dict[str, Any]] = {}
    for date in dates:
        for row in _season_day(date):
            season_id = str(row.get("season_id") or "").strip()
            if not season_id:
                continue
            key = (date, season_id)
            current = by_day.get(key)
            if current is None or int(row.get("play_count") or 0) > int(current.get("play_count") or 0):
                by_day[key] = row
    grouped: dict[str, dict[str, Any]] = {}
    title_map = _season_title_map()
    for row in by_day.values():
        season_id = str(row["season_id"]).strip()
        current = grouped.setdefault(season_id, {
            "season_id": season_id,
            "title": title_map.get(season_id, row.get("title") or "--"),
            "season_type": row.get("season_type"),
            "season_classify": row.get("season_classify"),
            "plot_type": row.get("plot_type"),
            "producer_region": row.get("producer_region"),
            "play_count": 0,
            "play_uv": 0,
        })
        current["play_count"] += int(row.get("play_count") or 0)
        current["play_uv"] += int(row.get("play_uv") or 0)
    return sorted(grouped.values(), key=lambda row: int(row.get("play_count") or 0), reverse=True)[:30]


@app.get("/api/hot-ranking")
def hot_ranking(
    start_date: str = Query(..., alias="start"),
    end_date: str = Query(..., alias="end"),
    ranking_type: str = Query("总榜", alias="type"),
):
    dates = _date_range(start_date, end_date)
    if ranking_type == "新用户榜":
        # The legacy new-user snapshot is daily and has no reliable range
        # aggregation, so keep this tab explicitly single-day.
        if start_date != end_date:
            raise HTTPException(status_code=400, detail="新用户榜仅支持单日查询")
        rows = query_all("SELECT 1 WHERE 0")
        return ok({"start": start_date, "end": end_date, "rows": rows, "previous_ids": []})
    previous_end = datetime.strptime(start_date, "%Y-%m-%d").date() - timedelta(days=1)
    previous_start = previous_end - timedelta(days=len(dates) - 1)
    previous_dates = _date_range(previous_start.isoformat(), previous_end.isoformat())
    rows = _aggregate_season_days(dates)
    previous_ids = sorted({str(row.get("season_id")) for row in _aggregate_season_days(previous_dates) if row.get("season_id")})
    return ok({"start": start_date, "end": end_date, "rows": rows, "previous_ids": previous_ids})


def require_local(request: Request) -> None:
    host = request.client.host if request.client else ""
    if host not in LOCAL_HOSTS:
        raise HTTPException(status_code=403, detail="该能力仅允许在本机使用")


def serialize_video(row: dict[str, Any]) -> dict[str, Any]:
    views = int(row.get("latest_view_count") or 0)
    likes = int(row.get("latest_like_count") or 0)
    comments = int(row.get("latest_comment_count") or 0)
    payload = {
        **row,
        "thumbnail_fallback": row.get("thumbnail_url") or "",
        "views": views,
        "likes": likes,
        "comments": comments,
        "engagement_rate": (likes + comments) / views if views else 0,
        "content_type_label": CONTENT_TYPES.get(row.get("content_type") or "other", "其他"),
    }
    payload["tags"] = parse_json(row.get("tags_json"), [])
    payload["hypotheses"] = parse_json(row.get("hypotheses_json"), [])
    return payload


def serialize_title(row: dict[str, Any]) -> dict[str, Any]:
    payload = {**row}
    for source, target in (("genres", "genres"), ("origin_countries", "origin_country"), ("cast_names", "cast"), ("creators", "creators")):
        value = row.get(source) or ""
        payload[target] = [item.strip() for item in str(value).split("|") if item.strip()]
    return payload


class BriefRequest(BaseModel):
    video_ids: list[str] = Field(default_factory=list, max_length=5)
    objective: str = Field(default="提升影视内容曝光与互动", min_length=2, max_length=200)


class CollectRequest(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=50)
    skip_fetch: bool = False
    skip_tmdb: bool = False


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health():
    return ok({"status": "ok", "database": DB_PATH.name, "checked_at": utc_now()})


@app.get("/api/overview")
def overview():
    totals = query_all(
        """SELECT COUNT(*) AS video_count,COUNT(DISTINCT channel_id) AS channel_count,
                  COALESCE(SUM(latest_view_count),0) AS total_views,
                  COALESCE(SUM(latest_like_count),0) AS total_likes,
                  COALESCE(SUM(latest_comment_count),0) AS total_comments,
                  COALESCE(AVG(heat_score),0) AS avg_heat_score,
                  MAX(latest_fetched_at) AS data_freshness
           FROM videos"""
    )[0]
    total_views = int(totals["total_views"] or 0)
    totals["engagement_rate"] = (
        (int(totals["total_likes"] or 0) + int(totals["total_comments"] or 0)) / total_views
        if total_views else 0
    )
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat(timespec="seconds").replace("+00:00", "Z")
    totals["recent_video_count"] = query_all(
        "SELECT COUNT(*) AS value FROM videos WHERE published_at>=?", (cutoff,)
    )[0]["value"]
    totals["mapped_video_count"] = query_all("SELECT COUNT(DISTINCT video_id) AS value FROM video_tmdb_links")[0]["value"]
    totals["title_count"] = query_all("SELECT COUNT(*) AS value FROM tmdb_titles")[0]["value"]
    totals["latest_run"] = (query_all("SELECT * FROM collection_runs ORDER BY started_at DESC LIMIT 1") or [None])[0]
    totals["channels"] = channels()["data"]
    totals["top_titles"] = titles()["data"][:5]
    totals["metric_trend"] = query_all(
        """SELECT substr(collected_at,1,10) AS date,COUNT(*) AS snapshot_count,
                  COALESCE(SUM(view_count),0) AS total_views,
                  COALESCE(AVG(engagement_rate),0) AS avg_engagement_rate
           FROM video_metrics GROUP BY substr(collected_at,1,10) ORDER BY date"""
    )
    alerts = []
    latest = totals["latest_run"]
    if latest and latest.get("status") != "success":
        alerts.append({"level": "warning", "message": f"最近一次采集状态为{latest['status']}：{latest.get('error_summary') or '请查看日志'}"})
    if totals["mapped_video_count"] < totals["video_count"]:
        alerts.append({"level": "info", "message": f"仍有{totals['video_count'] - totals['mapped_video_count']}条视频未关联TMDb项目"})
    totals["alerts"] = alerts
    totals["generated_at"] = utc_now()
    return ok(totals)


@app.get("/api/videos")
def videos(
    q: str = "",
    channel: str = "",
    content_type: str = "",
    tmdb_id: int | None = None,
    published_after: str = "",
    published_before: str = "",
    sort: str = "heat",
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters: list[str] = ["1=1"]
    params: list[Any] = []
    if q.strip():
        filters.append("(v.title LIKE ? OR v.description LIKE ? OR t.title LIKE ?)")
        token = f"%{q.strip()}%"
        params.extend([token, token, token])
    if channel.strip():
        filters.append("(v.channel_id=? OR v.channel_title=?)")
        params.extend([channel.strip(), channel.strip()])
    if content_type.strip():
        filters.append("v.content_type=?")
        params.append(content_type.strip())
    if tmdb_id is not None:
        filters.append("t.tmdb_id=?")
        params.append(tmdb_id)
    if published_after.strip():
        filters.append("v.published_at>=?")
        params.append(published_after.strip())
    if published_before.strip():
        filters.append("v.published_at<=?")
        params.append(published_before.strip())
    orders = {
        "heat": "COALESCE(v.heat_score,0) DESC,COALESCE(v.latest_view_count,0) DESC",
        "views": "COALESCE(v.latest_view_count,0) DESC",
        "engagement": "CASE WHEN v.latest_view_count>0 THEN (v.latest_like_count+v.latest_comment_count)*1.0/v.latest_view_count ELSE 0 END DESC",
        "newest": "v.published_at DESC",
    }
    where = " AND ".join(filters)
    joins = """FROM videos v
        LEFT JOIN video_tmdb_links l ON l.platform=v.platform AND l.video_id=v.video_id
        LEFT JOIN tmdb_titles t ON t.tmdb_id=l.tmdb_id"""
    total = query_all(f"SELECT COUNT(DISTINCT v.platform || ':' || v.video_id) AS value {joins} WHERE {where}", tuple(params))[0]["value"]
    rows = query_all(
        f"""SELECT v.*,t.tmdb_id,t.title AS tmdb_title,t.popularity AS tmdb_popularity,
                    t.vote_average AS tmdb_vote_average,t.poster_url AS tmdb_poster_url
             {joins} WHERE {where} ORDER BY {orders.get(sort, orders['heat'])} LIMIT ? OFFSET ?""",
        tuple(params + [limit, offset]),
    )
    return ok({"items": [serialize_video(row) for row in rows], "limit": limit, "offset": offset, "count": total})


@app.get("/api/videos/{platform}/{video_id}")
def video_detail(platform: str, video_id: str):
    rows = query_all(
        """SELECT v.*,t.tmdb_id,t.title AS tmdb_title,t.overview AS tmdb_overview,
                  t.popularity AS tmdb_popularity,t.vote_average AS tmdb_vote_average,t.poster_url AS tmdb_poster_url
           FROM videos v
           LEFT JOIN video_tmdb_links l ON l.platform=v.platform AND l.video_id=v.video_id
           LEFT JOIN tmdb_titles t ON t.tmdb_id=l.tmdb_id
           WHERE v.platform=? AND v.video_id=?""",
        (platform, video_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="视频不存在")
    payload = serialize_video(rows[0])
    payload["metric_history"] = query_all(
        """SELECT collected_at,view_count,like_count,comment_count,engagement_rate,views_per_hour
           FROM video_metrics WHERE platform=? AND video_id=? ORDER BY collected_at""",
        (platform, video_id),
    )
    return ok(payload)


@app.get("/api/channels")
def channels():
    rows = query_all(
        """SELECT c.*,COUNT(v.video_id) AS video_count,COALESCE(SUM(v.latest_view_count),0) AS total_views,
                  COALESCE(SUM(v.latest_like_count+v.latest_comment_count),0) AS total_interactions,
                  COALESCE(AVG(v.heat_score),0) AS avg_heat_score
           FROM channels c LEFT JOIN videos v ON v.platform=c.platform AND v.channel_id=c.channel_id
           GROUP BY c.platform,c.channel_id ORDER BY total_views DESC"""
    )
    for row in rows:
        row["engagement_rate"] = row["total_interactions"] / row["total_views"] if row["total_views"] else 0
    return ok(rows)


@app.get("/api/titles")
def titles():
    return ok([serialize_title(row) for row in query_all(
        """SELECT t.*,COUNT(DISTINCT l.video_id) AS video_count,
                  COUNT(DISTINCT v.channel_id) AS channel_count,COALESCE(SUM(v.latest_view_count),0) AS total_views,
                  COALESCE(MAX(v.heat_score),0) AS best_heat_score
           FROM tmdb_titles t
           LEFT JOIN video_tmdb_links l ON l.tmdb_id=t.tmdb_id
           LEFT JOIN videos v ON v.platform=l.platform AND v.video_id=l.video_id
           GROUP BY t.tmdb_id ORDER BY total_views DESC"""
    )])


@app.get("/api/titles/{tmdb_id}")
def title_detail(tmdb_id: int):
    rows = query_all("SELECT * FROM tmdb_titles WHERE tmdb_id=?", (tmdb_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="影视项目不存在")
    payload = serialize_title(rows[0])
    payload["videos"] = [serialize_video(row) for row in query_all(
        """SELECT v.* FROM videos v JOIN video_tmdb_links l
           ON l.platform=v.platform AND l.video_id=v.video_id WHERE l.tmdb_id=?
           ORDER BY COALESCE(v.heat_score,0) DESC""", (tmdb_id,)
    )]
    payload["channel_coverage"] = sorted({row.get("channel_title") for row in payload["videos"] if row.get("channel_title")})
    return ok(payload)


@app.get("/api/runs")
def runs(limit: int = Query(20, ge=1, le=100)):
    return ok(query_all("SELECT * FROM collection_runs ORDER BY started_at DESC LIMIT ?", (limit,)))


@app.get("/api/tasks/{run_id}")
def task(run_id: str):
    rows = query_all("SELECT * FROM collection_runs WHERE run_id=?", (run_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="任务不存在")
    return ok(rows[0])


def _run_collection(run_id: str, request: CollectRequest) -> None:
    try:
        execute_pipeline(request.limit, request.skip_fetch, request.skip_tmdb, run_id)
    finally:
        TASK_THREADS.pop(run_id, None)


@app.post("/api/tasks/collect")
def collect(request_body: CollectRequest, request: Request):
    require_local(request)
    running = query_all("SELECT run_id FROM collection_runs WHERE status='running' ORDER BY started_at DESC LIMIT 1")
    if running:
        raise HTTPException(status_code=409, detail=f"已有采集任务运行中：{running[0]['run_id']}")
    run_id = start_run(len(read_handles(ROOT / "channels.txt")))
    thread = threading.Thread(target=_run_collection, args=(run_id, request_body), daemon=True, name=f"collect-{run_id[:8]}")
    TASK_THREADS[run_id] = thread
    thread.start()
    return ok({"run_id": run_id, "status": "running"}, "collection started")


@app.get("/api/ai/briefs")
def briefs(limit: int = Query(20, ge=1, le=100)):
    rows = query_all("SELECT * FROM ai_briefs ORDER BY created_at DESC LIMIT ?", (limit,))
    for row in rows:
        row["source_video_ids"] = parse_json(row["source_video_ids"], [])
        row["evidence"] = parse_json(row.pop("evidence_payload"), [])
        row["brief"] = parse_json(row.pop("brief_payload"), {})
    return ok(rows)


@app.post("/api/ai/briefs")
def create_brief(request_body: BriefRequest, request: Request):
    require_local(request)
    try:
        return ok(generate_brief(request_body.video_ids, request_body.objective), "brief generated")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail="选题生成失败，请查看logs/run.log") from error


def _export_response(kind: str) -> FileResponse:
    files = generate_exports()
    path = files[kind]
    media = "text/markdown; charset=utf-8" if path.suffix == ".md" else "text/csv; charset=utf-8"
    return FileResponse(path, media_type=media, filename=path.name)


@app.get("/api/exports/videos.csv")
def export_videos(request: Request):
    require_local(request)
    return _export_response("videos")


@app.get("/api/exports/recommendations.csv")
def export_recommendations(request: Request):
    require_local(request)
    return _export_response("recommendations")


@app.get("/api/exports/report.md")
def export_report(request: Request):
    require_local(request)
    return _export_response("report")


@app.get("/api/logs/recent")
def recent_logs(request: Request, lines: int = Query(80, ge=10, le=300)):
    require_local(request)
    if not LOG_PATH.exists():
        return ok([])
    content = LOG_PATH.read_text(encoding="utf-8", errors="replace").splitlines()[-lines:]
    secret_pattern = re.compile(r"(?i)(api[_-]?key|token|authorization)(\s*[=:]\s*)\S+")
    return ok([secret_pattern.sub(r"\1\2***", line) for line in content])


@app.get("/api/dashboard-snapshot")
def dashboard_snapshot():
    path = ROOT / "dashboard_web" / "src" / "dashboard-data.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="dashboard snapshot not found")
    return ok(json.loads(path.read_text(encoding="utf-8")))
