"""Run collection, enrichment, analysis, persistence and exports in sequence."""

from __future__ import annotations

import argparse
import sys

from analyze_content import run as analyze
from common import ROOT, read_csv, setup_logging
from database import finish_run, init_db, start_run, upsert_dataset
from enrich_tmdb import run as enrich_tmdb
from export_service import generate_exports
from fetch_youtube import read_handles, run as fetch_youtube


def execute(
    limit: int | None = None,
    skip_fetch: bool = False,
    skip_tmdb: bool = False,
    run_id: str | None = None,
) -> dict:
    """Execute the complete workflow and return the persisted run summary."""
    logger = setup_logging("pipeline")
    handles = read_handles(ROOT / "channels.txt")
    init_db()
    active_run_id = run_id or start_run(len(handles))
    try:
        youtube_csv = ROOT / "data" / "clean" / "youtube_competitor_videos.csv"
        merged_csv = ROOT / "data" / "final" / "youtube_tmdb_merged.csv"
        if not skip_fetch:
            youtube_csv = fetch_youtube(ROOT / "channels.txt", max(1, limit) if limit is not None else None)
        if not skip_tmdb:
            merged_csv = enrich_tmdb(youtube_csv, ROOT / "title_keywords.csv")
        recommendations_csv = analyze(merged_csv)
        rows = read_csv(recommendations_csv)
        stats = upsert_dataset(rows, active_run_id)
        successful_channels = len({row.get("channel_id") for row in rows if row.get("channel_id")})
        stats.update({
            "successful_channels": successful_channels,
            "failed_channels": max(0, len(handles) - successful_channels),
        })
        status = "success" if stats["failed_channels"] == 0 else "partial_success"
        finish_run(active_run_id, status, stats)
        exports = generate_exports()
        result = {"run_id": active_run_id, "status": status, **stats, "exports": {key: str(path) for key, path in exports.items()}}
        logger.info(
            "流水线完成：run_id=%s，状态=%s，新增=%s，更新=%s，指标快照=%s",
            active_run_id, status, stats["videos_inserted"], stats["videos_updated"], stats["metrics_inserted"],
        )
        return result
    except Exception as error:
        finish_run(active_run_id, "failed", {}, str(error))
        logger.exception("流水线停止：%s", error)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description="海外影视内容运营数据流水线")
    parser.add_argument("--limit", type=int, default=None, help="覆盖全部频道采集条数；默认读取channels.txt单频道配置")
    parser.add_argument("--skip-fetch", action="store_true", help="使用已有YouTube CSV")
    parser.add_argument("--skip-tmdb", action="store_true", help="使用已有TMDb合并CSV")
    parser.add_argument("--run-id", default=None, help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        execute(args.limit, args.skip_fetch, args.skip_tmdb, args.run_id)
        return 0
    except Exception:
        return 1


if __name__ == "__main__":
    sys.exit(main())
