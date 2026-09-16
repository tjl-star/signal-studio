from __future__ import annotations

import argparse
from datetime import date, timedelta
from pathlib import Path

import uvicorn

from app.database import default_database_url
from app.sync.content_ranking import import_content_ranking_snapshot
from app.sync.overview import import_overview_snapshots
from app.sync.search_conversion import import_search_conversion_snapshot
from app.sync.resource_placement import import_resource_snapshots
from app.sync.home_operations import import_home_operations
from app.sync.search_ranking import import_search_rankings
from app.sync.bl_consumption import import_bl_consumption
from app.sync.genre_contribution import import_genre_contribution
from app.sync.playback_growth import import_playback_growth
from app.sync.all_data import import_all_snapshots
from app.sync.quickbi_mcp import sync_quickbi_dashboard
from app.maintenance import create_backup, restore_backup


def main() -> int:
    parser = argparse.ArgumentParser(description="Signal Studio 本地运行工具")
    commands = parser.add_subparsers(dest="command", required=True)

    import_command = commands.add_parser("import-overview", help="导入运营总览快照")
    import_command.add_argument("--source-dir", type=Path, required=True)
    import_command.add_argument("--database-url", default=None)

    ranking_command = commands.add_parser("import-content-ranking", help="导入内容榜单快照")
    ranking_command.add_argument("--source-file", type=Path, required=True)
    ranking_command.add_argument("--database-url", default=None)

    search_command = commands.add_parser("import-search-conversion", help="导入搜索转化快照")
    search_command.add_argument("--source-file", type=Path, required=True)
    search_command.add_argument("--database-url", default=None)
    resource_command = commands.add_parser("import-resources", help="导入资源位快照")
    resource_command.add_argument("--source-dir", type=Path, required=True)
    resource_command.add_argument("--database-url", default=None)
    home_command=commands.add_parser("import-home-operations",help="导入首页运营快照");home_command.add_argument("--source-dir",type=Path,required=True);home_command.add_argument("--database-url",default=None)
    search_rank_command=commands.add_parser("import-search-rankings",help="导入热搜榜单");search_rank_command.add_argument("--source-dir",type=Path,required=True);search_rank_command.add_argument("--database-url",default=None)
    bl_command=commands.add_parser("import-bl-consumption",help="导入BL内容消费");bl_command.add_argument("--source-file",type=Path,required=True);bl_command.add_argument("--database-url",default=None)
    genre_command=commands.add_parser("import-genre-contribution",help="导入剧种内容贡献");genre_command.add_argument("--source-file",type=Path,required=True);genre_command.add_argument("--database-url",default=None)
    growth_command=commands.add_parser("import-playback-growth",help="导入播放增长榜");growth_command.add_argument("--source-file",type=Path,required=True);growth_command.add_argument("--database-url",default=None)
    all_command=commands.add_parser("import-all",help="导入全部已迁移数据");all_command.add_argument("--source-dir",type=Path,required=True);all_command.add_argument("--database-url",default=None)
    yesterday = date.today() - timedelta(days=1)
    sync_command = commands.add_parser("sync-mcp", help="从 Quick BI MCP 增量同步已核验数据")
    sync_command.add_argument("--start-date", type=date.fromisoformat, default=yesterday)
    sync_command.add_argument("--end-date", type=date.fromisoformat, default=yesterday)
    sync_command.add_argument("--database-url", default=None)
    backup_command=commands.add_parser("backup",help="备份本地运行数据");backup_command.add_argument("--output-dir",type=Path,default=Path("backups"))
    restore_command=commands.add_parser("restore",help="恢复本地运行数据");restore_command.add_argument("--archive",type=Path,required=True);restore_command.add_argument("--confirm",action="store_true")

    serve_command = commands.add_parser("serve", help="启动本地一体化服务")
    serve_command.add_argument("--host", default="127.0.0.1")
    serve_command.add_argument("--port", type=int, default=8765)

    args = parser.parse_args()
    if args.command == "import-overview":
        result = import_overview_snapshots(args.source_dir, args.database_url or default_database_url())
        print(
            f"运营总览导入完成：{result.inserted_or_updated} 行，"
            f"{result.start_date} 至 {result.end_date}"
        )
        return 0
    if args.command == "import-content-ranking":
        result = import_content_ranking_snapshot(
            args.source_file,
            args.database_url or default_database_url(),
        )
        print(
            f"内容榜单导入完成：{result.inserted_or_updated} 行，"
            f"{result.start_date} 至 {result.end_date}，{', '.join(result.list_types)}"
        )
        return 0
    if args.command == "serve":
        uvicorn.run("app.main:app", host=args.host, port=args.port)
        return 0
    if args.command == "import-search-conversion":
        result = import_search_conversion_snapshot(args.source_file, args.database_url or default_database_url())
        print(f"搜索转化导入完成：{result.inserted_or_updated} 行，{result.start_date} 至 {result.end_date}")
        return 0
    if args.command == "import-resources":
        base=args.source_dir
        result=import_resource_snapshots(base/"home_section_ops_20260705_20260804.json",base/"banner_click_detail.json",base/"popup_window_20260701_20260827_android_rrsp_xb.json",args.database_url or default_database_url())
        print(f"资源位导入完成：板块 {result['section']}，Banner {result['banner']}，弹窗 {result['popup']}")
        return 0
    if args.command == "import-home-operations":
        base=args.source_dir;result=import_home_operations(base/"首页流量与转化漏斗_20260705_20260804.json",base/"guess_you_like_home_quickbi_20260701_20260825.json",args.database_url or default_database_url());print(f"首页运营导入完成：频道 {result['channel']}，猜你喜欢 {result['recommendation']}");return 0
    if args.command == "import-search-rankings":
        base=args.source_dir;count=import_search_rankings(base/"热搜总榜_20260704_20260804.json",base/"新用户热搜_词频_20260704_20260804.json",args.database_url or default_database_url());print(f"热搜榜单导入完成：{count} 行");return 0
    if args.command == "import-bl-consumption":
        result=import_bl_consumption(args.source_file,args.database_url or default_database_url());print(f"BL内容消费导入完成：汇总 {result['summaries']}，明细 {result['entries']}");return 0
    if args.command == "import-genre-contribution":
        result=import_genre_contribution(args.source_file,args.database_url or default_database_url());print(f"剧种贡献导入完成：汇总 {result['summaries']}，明细 {result['entries']}");return 0
    if args.command == "import-playback-growth":
        count=import_playback_growth(args.source_file,args.database_url or default_database_url());print(f"播放增长榜导入完成：{count} 行");return 0
    if args.command == "import-all":
        result=import_all_snapshots(args.source_dir,args.database_url or default_database_url());print("全部数据导入完成："+"，".join(f"{k}={v}" for k,v in result.items()));return 0
    if args.command == "sync-mcp":
        result = sync_quickbi_dashboard(
            args.start_date,
            args.end_date,
            args.database_url or default_database_url(),
        )
        print(
            f"MCP 同步完成：搜索转化 {result.search_conversion} 行，"
            f"猜你喜欢 {result.recommendation} 行，{result.start_date} 至 {result.end_date}"
        )
        return 0
    if args.command == "backup":
        archive=create_backup(args.output_dir);print(f"备份完成：{archive.resolve()}");return 0
    if args.command == "restore":
        database=restore_backup(args.archive,args.confirm);print(f"恢复完成：{database.resolve()}");return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
