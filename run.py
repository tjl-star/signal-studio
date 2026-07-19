"""Single command-line entry point for the Signal Studio backend."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))


def main() -> int:
    parser = argparse.ArgumentParser(description="Signal Studio 海外影视内容运营AI工作台")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("init", help="初始化SQLite并生成当前导出文件")
    pipeline = subparsers.add_parser("pipeline", help="执行YouTube、TMDb、分析、入库和导出")
    pipeline.add_argument("--limit", type=int, default=None)
    pipeline.add_argument("--skip-fetch", action="store_true")
    pipeline.add_argument("--skip-tmdb", action="store_true")
    api = subparsers.add_parser("api", help="启动本地FastAPI服务")
    api.add_argument("--host", default="127.0.0.1")
    api.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.command == "init":
        from database import init_db
        from export_service import generate_exports
        init_db()
        generate_exports()
        print("初始化完成：SQLite和导出文件已就绪。")
        return 0
    if args.command == "pipeline":
        from run_pipeline import execute
        result = execute(args.limit, args.skip_fetch, args.skip_tmdb)
        print(f"流水线完成：{result['run_id']} / {result['status']}")
        return 0
    if args.command == "api":
        import uvicorn
        from api import app
        uvicorn.run(app, host=args.host, port=args.port)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
