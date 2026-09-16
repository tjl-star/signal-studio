from pathlib import Path
from app.sync.bl_consumption import import_bl_consumption
from app.sync.content_ranking import import_content_ranking_snapshot
from app.sync.genre_contribution import import_genre_contribution
from app.sync.home_operations import import_home_operations
from app.sync.overview import import_overview_snapshots
from app.sync.playback_growth import import_playback_growth
from app.sync.resource_placement import import_resource_snapshots
from app.sync.search_conversion import import_search_conversion_snapshot
from app.sync.search_ranking import import_search_rankings
def import_all_snapshots(source_dir:Path,database_url=None):
    growth=source_dir/"content_growth_tabs.json"
    results={}
    results["overview"]=import_overview_snapshots(source_dir,database_url).inserted_or_updated
    results["content_ranking"]=import_content_ranking_snapshot(source_dir/"站内播放排名Top30_20260706_20260804.json",database_url).inserted_or_updated
    results["search_conversion"]=import_search_conversion_snapshot(source_dir/"search_overall_conversion_20260701_20260825.json",database_url).inserted_or_updated
    resources=import_resource_snapshots(source_dir/"home_section_ops_20260705_20260804.json",source_dir/"banner_click_detail.json",source_dir/"popup_window_20260701_20260827_android_rrsp_xb.json",database_url);results.update({f"resource_{k}":v for k,v in resources.items()})
    home=import_home_operations(source_dir/"首页流量与转化漏斗_20260705_20260804.json",source_dir/"guess_you_like_home_quickbi_20260701_20260825.json",database_url);results.update({f"home_{k}":v for k,v in home.items()})
    results["search_ranking"]=import_search_rankings(source_dir/"热搜总榜_20260704_20260804.json",source_dir/"新用户热搜_词频_20260704_20260804.json",database_url)
    results["bl_consumption"]=sum(import_bl_consumption(growth,database_url).values())
    results["genre_contribution"]=sum(import_genre_contribution(growth,database_url).values())
    results["playback_growth"]=import_playback_growth(growth,database_url)
    return results
