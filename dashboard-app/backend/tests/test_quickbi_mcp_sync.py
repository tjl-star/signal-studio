from datetime import date

import pytest
from sqlalchemy import func, select

from app.database import create_database_engine, create_session_factory
from app.models import RecommendationMetric, SearchConversionDaily, SyncRun
from app.sync.quickbi_mcp import sync_quickbi_dashboard


class FakeMcpClient:
    def call(self, name, arguments):
        assert arguments["start_date"] == "20260915"
        assert arguments["end_date"] == "20260915"
        if name == "search_drama_conversion_data":
            return [{
                "date": "20260915", "into_search_click_uv": "194542",
                "search_suc_uv": "187527", "search_suc_uv_ratio": "96.39%",
                "result_content_click_uv": "153178",
                "result_video_after_ad_play_start_uv": "130920",
                "result_play_5mins_uv": "57184", "ff_play_uv_rate": "67.30%",
                "play_5min_uv_rate": "29.39%", "result_play_time_uv": "38.53",
            }]
        assert name == "recommend_data"
        assert arguments["source_type"] == "猜你喜欢"
        return [
            {"date": "20260915", "page": "剧集详情页", "source_type": "猜你喜欢"},
            {
                "date": "20260915", "page": "首页", "source_type": "猜你喜欢",
                "front_tab_uv": "474039", "total_content_exposure_uv": "61684",
                "total_content_click_uv": "22874", "total_content_click_rate": "37.08%",
                "ff_play_convert_rate": "34.46%", "play_convert_rate": "92.94%",
                "play_5min_rate_uv": "10.80%", "avg_time_uv": "25.99",
            },
        ]


def test_sync_quickbi_dashboard_maps_and_publishes_atomically(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'db.sqlite3'}"
    result = sync_quickbi_dashboard(
        date(2026, 9, 15), date(2026, 9, 15), database_url, FakeMcpClient()
    )
    assert result.search_conversion == 1
    assert result.recommendation == 1

    engine = create_database_engine(database_url)
    factory = create_session_factory(engine)
    with factory() as session:
        search = session.scalar(select(SearchConversionDaily))
        recommendation = session.scalar(select(RecommendationMetric))
        assert search.search_suc_uv_ratio == pytest.approx(0.9639)
        assert search.result_play_time_uv == pytest.approx(38.53)
        assert recommendation.page == "首页"
        assert recommendation.content_click_rate == pytest.approx(0.3708)
        assert session.scalar(select(func.count()).select_from(SyncRun)) == 2
        assert {run.source for run in session.scalars(select(SyncRun))} == {
            "Quick BI MCP/search_drama_conversion_data",
            "Quick BI MCP/recommend_data",
        }
    engine.dispose()


class FailingMcpClient:
    def call(self, name, arguments):
        if name == "search_drama_conversion_data":
            return [{"date": "20260915"}]
        raise RuntimeError("remote failure")


def test_sync_failure_does_not_publish_partial_data(tmp_path):
    database_path = tmp_path / "db.sqlite3"
    with pytest.raises(RuntimeError, match="remote failure"):
        sync_quickbi_dashboard(
            date(2026, 9, 15),
            date(2026, 9, 15),
            f"sqlite:///{database_path}",
            FailingMcpClient(),
        )
    assert not database_path.exists()
