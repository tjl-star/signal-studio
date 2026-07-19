"""Stage 1: fetch recent public videos from competitor YouTube channels."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import requests

from common import DATA_DIR, ROOT, require_env, save_raw_json, setup_logging, utc_now, write_csv


API_ROOT = "https://www.googleapis.com/youtube/v3"
OUTPUT_CSV = DATA_DIR / "clean" / "youtube_competitor_videos.csv"
FIELDS = [
    "platform", "channel_handle", "channel_id", "channel_title", "subscriber_count",
    "video_id", "video_url", "title", "description", "tags", "published_at",
    "duration", "view_count", "like_count", "comment_count", "thumbnail_url", "fetched_at",
]


def api_get(endpoint: str, params: dict[str, Any], api_key: str, logger) -> dict[str, Any]:
    safe_params = {key: value for key, value in params.items() if key != "key"}
    logger.info("请求YouTube %s，参数=%s", endpoint, safe_params)
    session = requests.Session()
    session.trust_env = False
    proxy = os.getenv("API_PROXY", "").strip()
    if proxy:
        session.proxies.update({"http": proxy, "https": proxy})
    response = session.get(f"{API_ROOT}/{endpoint}", params={**params, "key": api_key}, timeout=(5, 25))
    if not response.ok:
        logger.error("YouTube %s请求失败：HTTP %s，响应=%s", endpoint, response.status_code, response.text[:500])
    response.raise_for_status()
    return response.json()


def read_handles(path: Path) -> list[str]:
    return [handle for handle, _ in read_targets(path)]


def safe_limit(value: Any, default: int) -> int:
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return default


def read_targets(path: Path, override_limit: int | None = None, default_limit: int = 30) -> list[tuple[str, int]]:
    """Read `@handle` or `@handle,limit`; CLI limit overrides per-channel values."""
    if not path.exists():
        raise FileNotFoundError(f"频道文件不存在：{path}")
    targets: list[tuple[str, int]] = []
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [part.strip() for part in line.split(",", 1)]
        handle = parts[0] if parts[0].startswith("@") else f"@{parts[0]}"
        configured = safe_limit(parts[1], default_limit) if len(parts) > 1 else default_limit
        targets.append((handle, max(1, override_limit if override_limit is not None else configured)))
    if not targets:
        raise ValueError("channels.txt中没有频道配置")
    return targets


def fetch_channel(handle: str, limit: int, api_key: str, raw: list[dict[str, Any]], logger) -> list[dict[str, Any]]:
    channel_payload = api_get(
        "channels",
        {"part": "snippet,statistics,contentDetails", "forHandle": handle.lstrip("@")},
        api_key,
        logger,
    )
    raw.append({"endpoint": "channels.list", "handle": handle, "payload": channel_payload})
    items = channel_payload.get("items", [])
    if not items:
        raise ValueError(f"没有找到频道{handle}")
    channel = items[0]
    uploads_id = channel.get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    if not uploads_id:
        raise ValueError(f"频道{handle}没有返回上传播放列表ID")

    video_ids: list[str] = []
    page_token = ""
    while len(video_ids) < limit:
        params: dict[str, Any] = {
            "part": "contentDetails",
            "playlistId": uploads_id,
            "maxResults": min(50, limit - len(video_ids)),
        }
        if page_token:
            params["pageToken"] = page_token
        playlist_payload = api_get("playlistItems", params, api_key, logger)
        raw.append({"endpoint": "playlistItems.list", "handle": handle, "page_token": page_token, "payload": playlist_payload})
        for item in playlist_payload.get("items", []):
            video_id = item.get("contentDetails", {}).get("videoId")
            if video_id and video_id not in video_ids:
                video_ids.append(video_id)
        page_token = playlist_payload.get("nextPageToken", "")
        if not page_token or not playlist_payload.get("items"):
            break
    if not video_ids:
        return []

    video_items: list[dict[str, Any]] = []
    for start in range(0, len(video_ids), 50):
        batch = video_ids[start:start + 50]
        payload = api_get(
            "videos",
            {"part": "snippet,statistics,contentDetails", "id": ",".join(batch), "maxResults": len(batch)},
            api_key,
            logger,
        )
        raw.append({"endpoint": "videos.list", "handle": handle, "batch": start // 50 + 1, "payload": payload})
        video_items.extend(payload.get("items", []))

    fetched_at = utc_now()
    channel_stats = channel.get("statistics", {})
    rows = []
    for item in video_items:
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})
        details = item.get("contentDetails", {})
        thumbs = snippet.get("thumbnails", {})
        thumbnail = (thumbs.get("maxres") or thumbs.get("high") or thumbs.get("medium") or thumbs.get("default") or {}).get("url", "")
        video_id = item.get("id", "")
        rows.append({
            "platform": "youtube",
            "channel_handle": handle,
            "channel_id": channel.get("id", ""),
            "channel_title": channel.get("snippet", {}).get("title", ""),
            "subscriber_count": channel_stats.get("subscriberCount", ""),
            "video_id": video_id,
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "tags": " | ".join(snippet.get("tags", [])),
            "published_at": snippet.get("publishedAt", ""),
            "duration": details.get("duration", ""),
            "view_count": stats.get("viewCount", ""),
            "like_count": stats.get("likeCount", ""),
            "comment_count": stats.get("commentCount", ""),
            "thumbnail_url": thumbnail,
            "fetched_at": fetched_at,
        })
    return rows


def run(channels_path: Path, limit: int | None = None) -> Path:
    logger = setup_logging("youtube")
    api_key = require_env("YOUTUBE_API_KEY")
    targets = read_targets(channels_path, limit)
    raw: list[dict[str, Any]] = []
    rows: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    for handle, target_limit in targets:
        try:
            channel_rows = fetch_channel(handle, target_limit, api_key, raw, logger)
            rows.extend(channel_rows)
            logger.info("%s获取%s条视频", handle, len(channel_rows))
        except requests.RequestException as error:
            status = error.response.status_code if error.response is not None else None
            reason = f"{type(error).__name__}; HTTP={status}"
            failures.append({"handle": handle, "reason": reason})
            logger.error("频道%s请求失败：%s", handle, reason)
        except (ValueError, KeyError) as error:
            failures.append({"handle": handle, "reason": str(error)})
            logger.error("频道%s数据处理失败：%s", handle, error)
    raw_path = save_raw_json("youtube", raw, {"targets": [{"handle": h, "limit": n} for h, n in targets], "failures": failures})
    if rows:
        write_csv(OUTPUT_CSV, rows, FIELDS)
    logger.info("第一阶段完成：成功频道=%s/%s，总视频=%s，原始文件=%s，CSV=%s", len(targets) - len(failures), len(targets), len(rows), raw_path, OUTPUT_CSV)
    if not rows:
        raise RuntimeError("没有获取到任何视频，请查看logs/run.log")
    return OUTPUT_CSV


def main() -> int:
    parser = argparse.ArgumentParser(description="获取YouTube竞品频道最近公开视频")
    parser.add_argument("--channels", type=Path, default=ROOT / "channels.txt")
    parser.add_argument("--limit", type=int, default=None, help="覆盖全部频道采集数量；默认读取channels.txt配置")
    args = parser.parse_args()
    try:
        run(args.channels, max(1, args.limit) if args.limit is not None else None)
        return 0
    except Exception as error:
        setup_logging("youtube").exception("第一阶段失败：%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
