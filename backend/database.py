"""SQLite persistence for the content-operations workbench."""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable

from common import DATA_DIR, safe_float, safe_int, utc_now


DB_PATH = DATA_DIR / "database" / "monitor.db"


SCHEMA = """
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS collection_runs (
    run_id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL CHECK(status IN ('running','success','partial_success','failed')),
    requested_channels INTEGER NOT NULL DEFAULT 0,
    successful_channels INTEGER NOT NULL DEFAULT 0,
    failed_channels INTEGER NOT NULL DEFAULT 0,
    videos_seen INTEGER NOT NULL DEFAULT 0,
    videos_inserted INTEGER NOT NULL DEFAULT 0,
    videos_updated INTEGER NOT NULL DEFAULT 0,
    metrics_inserted INTEGER NOT NULL DEFAULT 0,
    tmdb_linked INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS channels (
    platform TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    handle TEXT,
    title TEXT NOT NULL,
    subscriber_count INTEGER,
    latest_fetched_at TEXT,
    PRIMARY KEY (platform, channel_id)
);

CREATE TABLE IF NOT EXISTS videos (
    platform TEXT NOT NULL,
    video_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    channel_title TEXT,
    video_url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT,
    published_at TEXT,
    duration TEXT,
    thumbnail_url TEXT,
    first_seen_at TEXT NOT NULL,
    latest_fetched_at TEXT NOT NULL,
    latest_view_count INTEGER,
    latest_like_count INTEGER,
    latest_comment_count INTEGER,
    heat_score REAL,
    recommendation TEXT,
    content_type TEXT NOT NULL DEFAULT 'other',
    classification_method TEXT NOT NULL DEFAULT 'rule:no_match',
    classification_confidence REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (platform, video_id)
);

CREATE TABLE IF NOT EXISTS video_metrics (
    metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    video_id TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    engagement_rate REAL,
    views_per_hour REAL,
    UNIQUE (run_id, platform, video_id),
    FOREIGN KEY (run_id) REFERENCES collection_runs(run_id),
    FOREIGN KEY (platform, video_id) REFERENCES videos(platform, video_id)
);

CREATE TABLE IF NOT EXISTS tmdb_titles (
    tmdb_id INTEGER PRIMARY KEY,
    media_type TEXT,
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT,
    release_date TEXT,
    genres TEXT,
    origin_countries TEXT,
    original_language TEXT,
    popularity REAL,
    vote_average REAL,
    vote_count INTEGER,
    poster_url TEXT,
    cast_names TEXT,
    creators TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS video_tmdb_links (
    platform TEXT NOT NULL,
    video_id TEXT NOT NULL,
    tmdb_id INTEGER NOT NULL,
    query TEXT,
    linked_at TEXT NOT NULL,
    PRIMARY KEY (platform, video_id, tmdb_id),
    FOREIGN KEY (platform, video_id) REFERENCES videos(platform, video_id),
    FOREIGN KEY (tmdb_id) REFERENCES tmdb_titles(tmdb_id)
);

CREATE TABLE IF NOT EXISTS ai_briefs (
    brief_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    generation_mode TEXT NOT NULL CHECK(generation_mode IN ('deepseek','gemini','openai','rule_fallback')),
    status TEXT NOT NULL CHECK(status IN ('success','failed')),
    objective TEXT NOT NULL,
    source_video_ids TEXT NOT NULL,
    evidence_payload TEXT NOT NULL,
    brief_payload TEXT NOT NULL,
    error_message TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_videos_channel ON videos(platform, channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_video_time ON video_metrics(platform, video_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_started ON collection_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_created ON ai_briefs(created_at DESC);
"""


@contextmanager
def connect(path: Path = DB_PATH):
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=20)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db(path: Path = DB_PATH) -> Path:
    with connect(path) as db:
        db.executescript(SCHEMA)
        video_columns = {row[1] for row in db.execute("PRAGMA table_info(videos)").fetchall()}
        migrations = {
            "content_type": "ALTER TABLE videos ADD COLUMN content_type TEXT NOT NULL DEFAULT 'other'",
            "classification_method": "ALTER TABLE videos ADD COLUMN classification_method TEXT NOT NULL DEFAULT 'rule:no_match'",
            "classification_confidence": "ALTER TABLE videos ADD COLUMN classification_confidence REAL NOT NULL DEFAULT 0",
        }
        for column, statement in migrations.items():
            if column not in video_columns:
                db.execute(statement)
        table_sql = db.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='ai_briefs'"
        ).fetchone()[0]
        if "'deepseek'" not in table_sql:
            db.executescript(
                """
                ALTER TABLE ai_briefs RENAME TO ai_briefs_legacy;
                CREATE TABLE ai_briefs (
                    brief_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    generation_mode TEXT NOT NULL CHECK(generation_mode IN ('deepseek','gemini','openai','rule_fallback')),
                    status TEXT NOT NULL CHECK(status IN ('success','failed')),
                    objective TEXT NOT NULL,
                    source_video_ids TEXT NOT NULL,
                    evidence_payload TEXT NOT NULL,
                    brief_payload TEXT NOT NULL,
                    error_message TEXT NOT NULL DEFAULT ''
                );
                INSERT INTO ai_briefs SELECT * FROM ai_briefs_legacy;
                DROP TABLE ai_briefs_legacy;
                CREATE INDEX IF NOT EXISTS idx_briefs_created ON ai_briefs(created_at DESC);
                """
            )
    return path


def start_run(requested_channels: int = 0, path: Path = DB_PATH) -> str:
    init_db(path)
    run_id = uuid.uuid4().hex
    with connect(path) as db:
        db.execute(
            "INSERT INTO collection_runs(run_id, started_at, status, requested_channels) VALUES(?,?,?,?)",
            (run_id, utc_now(), "running", requested_channels),
        )
    return run_id


def finish_run(run_id: str, status: str, stats: dict[str, Any], error_summary: str = "", path: Path = DB_PATH) -> None:
    allowed = {"success", "partial_success", "failed"}
    if status not in allowed:
        raise ValueError(f"Invalid run status: {status}")
    columns = [
        "successful_channels", "failed_channels", "videos_seen", "videos_inserted",
        "videos_updated", "metrics_inserted", "tmdb_linked",
    ]
    values = [safe_int(stats.get(column)) for column in columns]
    with connect(path) as db:
        db.execute(
            f"UPDATE collection_runs SET finished_at=?, status=?, {', '.join(f'{c}=?' for c in columns)}, error_summary=? WHERE run_id=?",
            (utc_now(), status, *values, error_summary[:2000], run_id),
        )


def upsert_dataset(rows: Iterable[dict[str, Any]], run_id: str, path: Path = DB_PATH) -> dict[str, int]:
    init_db(path)
    inserted = updated = metrics = linked = seen = 0
    collected_at = utc_now()
    with connect(path) as db:
        for row in rows:
            platform = str(row.get("platform") or "youtube")
            video_id = str(row.get("video_id") or "").strip()
            channel_id = str(row.get("channel_id") or "").strip()
            if not video_id or not channel_id:
                continue
            seen += 1
            fetched_at = str(row.get("fetched_at") or collected_at)
            db.execute(
                """INSERT INTO channels(platform,channel_id,handle,title,subscriber_count,latest_fetched_at)
                   VALUES(?,?,?,?,?,?)
                   ON CONFLICT(platform,channel_id) DO UPDATE SET
                     handle=excluded.handle,title=excluded.title,subscriber_count=excluded.subscriber_count,
                     latest_fetched_at=excluded.latest_fetched_at""",
                (platform, channel_id, row.get("channel_handle"), row.get("channel_title") or channel_id,
                 safe_int(row.get("subscriber_count")), fetched_at),
            )
            exists = db.execute(
                "SELECT 1 FROM videos WHERE platform=? AND video_id=?", (platform, video_id)
            ).fetchone()
            db.execute(
                """INSERT INTO videos(
                     platform,video_id,channel_id,channel_title,video_url,title,description,tags,published_at,
                     duration,thumbnail_url,first_seen_at,latest_fetched_at,latest_view_count,latest_like_count,
                     latest_comment_count,heat_score,recommendation,content_type,classification_method,
                     classification_confidence)
                   VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(platform,video_id) DO UPDATE SET
                     channel_id=excluded.channel_id,channel_title=excluded.channel_title,video_url=excluded.video_url,
                     title=excluded.title,description=excluded.description,tags=excluded.tags,published_at=excluded.published_at,
                     duration=excluded.duration,thumbnail_url=excluded.thumbnail_url,latest_fetched_at=excluded.latest_fetched_at,
                     latest_view_count=excluded.latest_view_count,latest_like_count=excluded.latest_like_count,
                     latest_comment_count=excluded.latest_comment_count,heat_score=excluded.heat_score,
                     recommendation=excluded.recommendation,content_type=excluded.content_type,
                     classification_method=excluded.classification_method,
                     classification_confidence=excluded.classification_confidence""",
                (platform, video_id, channel_id, row.get("channel_title"), row.get("video_url"), row.get("title") or video_id,
                 row.get("description"), row.get("tags"), row.get("published_at"), row.get("duration"), row.get("thumbnail_url"),
                 fetched_at, fetched_at, safe_int(row.get("view_count")), safe_int(row.get("like_count")),
                 safe_int(row.get("comment_count")), safe_float(row.get("heat_score")), row.get("recommendation"),
                 row.get("content_type") or "other", row.get("classification_method") or "rule:no_match",
                 safe_float(row.get("classification_confidence"))),
            )
            inserted += int(exists is None)
            updated += int(exists is not None)
            views = safe_int(row.get("view_count"))
            likes = safe_int(row.get("like_count"))
            comments = safe_int(row.get("comment_count"))
            engagement = (likes + comments) / views if views else 0.0
            cursor = db.execute(
                """INSERT OR IGNORE INTO video_metrics(
                     run_id,platform,video_id,collected_at,view_count,like_count,comment_count,engagement_rate,views_per_hour)
                   VALUES(?,?,?,?,?,?,?,?,?)""",
                (run_id, platform, video_id, fetched_at, views, likes, comments, engagement, safe_float(row.get("views_per_hour"))),
            )
            metrics += max(cursor.rowcount, 0)
            tmdb_id = safe_int(row.get("tmdb_id"))
            if tmdb_id:
                db.execute(
                    """INSERT INTO tmdb_titles(
                         tmdb_id,media_type,title,original_title,overview,release_date,genres,origin_countries,
                         original_language,popularity,vote_average,vote_count,poster_url,cast_names,creators,updated_at)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                       ON CONFLICT(tmdb_id) DO UPDATE SET
                         media_type=excluded.media_type,title=excluded.title,original_title=excluded.original_title,
                         overview=excluded.overview,release_date=excluded.release_date,genres=excluded.genres,
                         origin_countries=excluded.origin_countries,original_language=excluded.original_language,
                         popularity=excluded.popularity,vote_average=excluded.vote_average,vote_count=excluded.vote_count,
                         poster_url=excluded.poster_url,cast_names=excluded.cast_names,creators=excluded.creators,
                         updated_at=excluded.updated_at""",
                    (tmdb_id, row.get("tmdb_media_type"), row.get("tmdb_title") or str(tmdb_id), row.get("tmdb_original_title"),
                     row.get("tmdb_overview"), row.get("tmdb_release_date"), row.get("tmdb_genres"),
                     row.get("tmdb_origin_countries"), row.get("tmdb_original_language"), safe_float(row.get("tmdb_popularity")),
                     safe_float(row.get("tmdb_vote_average")), safe_int(row.get("tmdb_vote_count")), row.get("tmdb_poster_url"),
                     row.get("tmdb_cast"), row.get("tmdb_creators"), fetched_at),
                )
                cursor = db.execute(
                    """INSERT OR IGNORE INTO video_tmdb_links(platform,video_id,tmdb_id,query,linked_at)
                       VALUES(?,?,?,?,?)""",
                    (platform, video_id, tmdb_id, row.get("tmdb_query"), fetched_at),
                )
                linked += max(cursor.rowcount, 0)
    return {"videos_seen": seen, "videos_inserted": inserted, "videos_updated": updated, "metrics_inserted": metrics, "tmdb_linked": linked}


def query_all(sql: str, params: tuple[Any, ...] = (), path: Path = DB_PATH) -> list[dict[str, Any]]:
    init_db(path)
    with connect(path) as db:
        return [dict(row) for row in db.execute(sql, params).fetchall()]


def save_brief(record: dict[str, Any], path: Path = DB_PATH) -> None:
    init_db(path)
    with connect(path) as db:
        db.execute(
            """INSERT INTO ai_briefs(
                 brief_id,created_at,provider,model,generation_mode,status,objective,source_video_ids,
                 evidence_payload,brief_payload,error_message)
               VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
            (record["brief_id"], record["created_at"], record["provider"], record["model"], record["generation_mode"],
             record["status"], record["objective"], json.dumps(record["source_video_ids"], ensure_ascii=False),
             json.dumps(record["evidence"], ensure_ascii=False), json.dumps(record["brief"], ensure_ascii=False),
             record.get("error_message", "")),
        )
