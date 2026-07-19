"""Stage 2: enrich mapped YouTube titles with TMDb metadata."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

import requests

from common import DATA_DIR, ROOT, read_csv, require_env, save_raw_json, setup_logging, write_csv


API_ROOT = "https://api.themoviedb.org/3"
YOUTUBE_CSV = DATA_DIR / "clean" / "youtube_competitor_videos.csv"
TMDB_CSV = DATA_DIR / "clean" / "tmdb_titles.csv"
MERGED_CSV = DATA_DIR / "final" / "youtube_tmdb_merged.csv"
TMDB_FIELDS = [
    "query", "tmdb_id", "media_type", "title", "original_title", "overview", "release_date",
    "genres", "origin_countries", "original_language", "popularity", "vote_average", "vote_count",
    "poster_url", "cast", "creators",
]


def api_get(endpoint: str, params: dict[str, Any], api_key: str, logger) -> dict[str, Any]:
    logger.info("请求TMDb %s，参数=%s", endpoint, params)
    session = requests.Session()
    session.trust_env = False
    proxy = os.getenv("API_PROXY", "").strip()
    if proxy:
        session.proxies.update({"http": proxy, "https": proxy})
    response = session.get(
        f"{API_ROOT}/{endpoint}",
        params={**params, "api_key": api_key, "language": "zh-CN"},
        timeout=(5, 25),
    )
    if not response.ok:
        logger.error("TMDb请求失败：HTTP %s，响应=%s", response.status_code, response.text[:500])
    response.raise_for_status()
    return response.json()


def load_mapping(path: Path) -> dict[str, dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"映射文件不存在：{path}")
    mapping: dict[str, dict[str, str]] = {}
    for row in read_csv(path):
        keyword = row.get("video_title_keyword", "").strip().casefold()
        query = row.get("tmdb_query", "").strip()
        if keyword and query:
            mapping[keyword] = {
                "query": query,
                "tmdb_id": row.get("tmdb_id", "").strip(),
                "media_type": row.get("media_type", "").strip(),
            }
    return mapping


def mapping_for_title(title: str, mapping: dict[str, dict[str, str]]) -> dict[str, str]:
    folded = title.casefold()
    for keyword, item in mapping.items():
        if keyword in folded:
            return item
    return {"query": "", "tmdb_id": "", "media_type": ""}


def fetch_title(
    query: str,
    api_key: str,
    raw: list[dict[str, Any]],
    logger,
    forced_id: str = "",
    forced_type: str = "",
) -> dict[str, Any]:
    if forced_id and forced_type in {"tv", "movie"}:
        tmdb_id, media_type = forced_id, forced_type
        logger.info("使用人工审核TMDb匹配：%s -> %s/%s", query, media_type, tmdb_id)
    else:
        search = api_get("search/multi", {"query": query, "include_adult": "false", "page": 1}, api_key, logger)
        raw.append({"endpoint": "search/multi", "query": query, "payload": search})
        candidates = [item for item in search.get("results", []) if item.get("media_type") in {"tv", "movie"}]
        if not candidates:
            return {"query": query}
        media_type, tmdb_id = candidates[0]["media_type"], candidates[0]["id"]
    detail = api_get(f"{media_type}/{tmdb_id}", {"append_to_response": "credits"}, api_key, logger)
    raw.append({"endpoint": f"{media_type}.details", "query": query, "payload": detail})
    credits = detail.get("credits", {})
    cast = [person.get("name", "") for person in credits.get("cast", [])[:8]]
    creators = [person.get("name", "") for person in detail.get("created_by", [])]
    if media_type == "movie":
        creators = [
            person.get("name", "") for person in credits.get("crew", [])
            if person.get("job") in {"Director", "Writer"}
        ][:6]
    poster_path = detail.get("poster_path")
    return {
        "query": query,
        "tmdb_id": tmdb_id,
        "media_type": media_type,
        "title": detail.get("name") or detail.get("title", ""),
        "original_title": detail.get("original_name") or detail.get("original_title", ""),
        "overview": detail.get("overview", ""),
        "release_date": detail.get("first_air_date") or detail.get("release_date", ""),
        "genres": " | ".join(item.get("name", "") for item in detail.get("genres", [])),
        "origin_countries": " | ".join(
            detail.get("origin_country", [])
            or [item.get("iso_3166_1", "") for item in detail.get("production_countries", [])]
        ),
        "original_language": detail.get("original_language", ""),
        "popularity": detail.get("popularity", 0),
        "vote_average": detail.get("vote_average", 0),
        "vote_count": detail.get("vote_count", 0),
        "poster_url": f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "",
        "cast": " | ".join(filter(None, cast)),
        "creators": " | ".join(filter(None, creators)),
    }


def run(youtube_csv: Path, mapping_csv: Path) -> Path:
    logger = setup_logging("tmdb")
    api_key = require_env("TMDB_API_KEY")
    videos = read_csv(youtube_csv)
    mapping = load_mapping(mapping_csv)
    mapped_items = {
        item["query"]: item
        for row in videos
        if (item := mapping_for_title(row.get("title", ""), mapping))["query"]
    }
    queries = sorted(mapped_items)
    raw: list[dict[str, Any]] = []
    enrichments: dict[str, dict[str, Any]] = {}
    failures: list[dict[str, str]] = []
    for query in queries:
        try:
            item = mapped_items[query]
            enrichments[query] = fetch_title(query, api_key, raw, logger, item["tmdb_id"], item["media_type"])
        except requests.RequestException as error:
            status = error.response.status_code if error.response is not None else None
            failures.append({"query": query, "reason": f"{type(error).__name__}; HTTP={status}"})
            logger.error("TMDb查询失败：%s，%s，HTTP=%s", query, type(error).__name__, status)
            enrichments[query] = {"query": query}
    write_csv(TMDB_CSV, enrichments.values(), TMDB_FIELDS)
    merged = []
    for video in videos:
        query = mapping_for_title(video.get("title", ""), mapping)["query"]
        tmdb = enrichments.get(query, {})
        merged.append({
            **video,
            "tmdb_query": query,
            **{(key if key.startswith("tmdb_") else f"tmdb_{key}"): value for key, value in tmdb.items() if key != "query"},
        })
    merged_fields = list(videos[0]) if videos else []
    merged_fields += ["tmdb_query"] + [
        field if field.startswith("tmdb_") else f"tmdb_{field}" for field in TMDB_FIELDS if field != "query"
    ]
    write_csv(MERGED_CSV, merged, merged_fields)
    raw_path = save_raw_json(
        "tmdb",
        raw,
        {
            "queries": queries,
            "failures": failures,
            "mapped_videos": sum(bool(mapping_for_title(row.get("title", ""), mapping)["query"]) for row in videos),
        },
    )
    logger.info("第二阶段完成：查询项目=%s，合并视频=%s，失败=%s，原始文件=%s", len(queries), len(merged), len(failures), raw_path)
    return MERGED_CSV


def main() -> int:
    parser = argparse.ArgumentParser(description="使用TMDb补充影视资料")
    parser.add_argument("--youtube", type=Path, default=YOUTUBE_CSV)
    parser.add_argument("--mapping", type=Path, default=ROOT / "title_keywords.csv")
    args = parser.parse_args()
    try:
        run(args.youtube, args.mapping)
        return 0
    except Exception as error:
        setup_logging("tmdb").exception("第二阶段失败：%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
