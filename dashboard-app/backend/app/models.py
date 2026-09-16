from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class DailyOverviewMetric(Base):
    __tablename__ = "daily_overview_metric"
    __table_args__ = (UniqueConstraint("date", "client", name="uq_overview_date_client"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    client: Mapped[str] = mapped_column(String(32), index=True)
    device_dau: Mapped[int | None] = mapped_column(Integer)
    new_device: Mapped[int | None] = mapped_column(Integer)
    play_rate: Mapped[float | None] = mapped_column(Float)
    avg_watch_duration: Mapped[float | None] = mapped_column(Float)
    avg_play_count: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(128), default="data_provider/coreData")
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SyncRun(Base):
    __tablename__ = "sync_run"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dataset: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(16))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(128))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContentRankingEntry(Base):
    __tablename__ = "content_ranking_entry"
    __table_args__ = (
        UniqueConstraint("date", "list_type", "rank", name="uq_content_ranking_date_type_rank"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    list_type: Mapped[str] = mapped_column(String(16), index=True)
    rank: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(256))
    season_id: Mapped[str | None] = mapped_column(String(64), index=True)
    play_uv: Mapped[int | None] = mapped_column(Integer)
    play_vv: Mapped[int | None] = mapped_column(Integer)
    day_change_rate: Mapped[float | None] = mapped_column(Float)
    day_change_text: Mapped[str | None] = mapped_column(String(32))
    week_change_rate: Mapped[float | None] = mapped_column(Float)
    week_change_text: Mapped[str | None] = mapped_column(String(32))
    collection_type: Mapped[str | None] = mapped_column(String(32))
    content_category: Mapped[str | None] = mapped_column(String(64))
    genre_tags: Mapped[str | None] = mapped_column(String(512))
    ranking_status: Mapped[str | None] = mapped_column(String(32))
    data_status: Mapped[str] = mapped_column(String(32))
    source_interface: Mapped[str] = mapped_column(String(64))
    limitation: Mapped[str | None] = mapped_column(String(512))
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SearchConversionDaily(Base):
    __tablename__ = "search_conversion_daily"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    into_search_click_uv: Mapped[int | None] = mapped_column(Integer)
    search_suc_uv: Mapped[int | None] = mapped_column(Integer)
    search_suc_uv_ratio: Mapped[float | None] = mapped_column(Float)
    result_content_click_uv: Mapped[int | None] = mapped_column(Integer)
    result_video_after_ad_play_start_uv: Mapped[int | None] = mapped_column(Integer)
    result_play_5mins_uv: Mapped[int | None] = mapped_column(Integer)
    ff_play_uv_rate: Mapped[float | None] = mapped_column(Float)
    play_5min_uv_rate: Mapped[float | None] = mapped_column(Float)
    result_play_time_uv: Mapped[float | None] = mapped_column(Float)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ResourcePlacementMetric(Base):
    __tablename__ = "resource_placement_metric"
    __table_args__ = (UniqueConstraint("resource_type", "date", "identity_key", name="uq_resource_type_date_identity"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resource_type: Mapped[str] = mapped_column(String(16), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    identity_key: Mapped[str] = mapped_column(String(512))
    name: Mapped[str] = mapped_column(String(512))
    channel: Mapped[str | None] = mapped_column(String(64), index=True)
    position: Mapped[str | None] = mapped_column(String(128))
    client: Mapped[str | None] = mapped_column(String(64), index=True)
    exposure_pv: Mapped[int | None] = mapped_column(Integer)
    exposure_uv: Mapped[int | None] = mapped_column(Integer)
    click_pv: Mapped[int | None] = mapped_column(Integer)
    click_uv: Mapped[int | None] = mapped_column(Integer)
    jump_pv: Mapped[int | None] = mapped_column(Integer)
    jump_uv: Mapped[int | None] = mapped_column(Integer)
    play_pv: Mapped[int | None] = mapped_column(Integer)
    play_uv: Mapped[int | None] = mapped_column(Integer)
    ctr: Mapped[float | None] = mapped_column(Float)
    conversion_rate: Mapped[float | None] = mapped_column(Float)
    play_rate: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(256))
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class HomeChannelMetric(Base):
    __tablename__ = "home_channel_metric"
    __table_args__ = (UniqueConstraint("date", "channel", name="uq_home_channel_date_channel"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    channel: Mapped[str] = mapped_column(String(64), index=True)
    entry_uv: Mapped[int | None] = mapped_column(Integer)
    content_click_uv: Mapped[int | None] = mapped_column(Integer)
    detail_play_uv: Mapped[int | None] = mapped_column(Integer)
    play_5m_uv: Mapped[int | None] = mapped_column(Integer)
    effective_play_uv: Mapped[int | None] = mapped_column(Integer)
    entry_click_rate: Mapped[float | None] = mapped_column(Float)
    click_play_rate: Mapped[float | None] = mapped_column(Float)
    detail_5m_rate: Mapped[float | None] = mapped_column(Float)
    play_5m_effective_rate: Mapped[float | None] = mapped_column(Float)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RecommendationMetric(Base):
    __tablename__ = "recommendation_metric"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    page: Mapped[str] = mapped_column(String(64))
    source_type: Mapped[str] = mapped_column(String(64))
    front_tab_uv: Mapped[int | None] = mapped_column(Integer)
    content_exposure_uv: Mapped[int | None] = mapped_column(Integer)
    content_click_uv: Mapped[int | None] = mapped_column(Integer)
    content_click_rate: Mapped[float | None] = mapped_column(Float)
    ff_play_convert_rate: Mapped[float | None] = mapped_column(Float)
    play_convert_rate: Mapped[float | None] = mapped_column(Float)
    play_5min_rate_uv: Mapped[float | None] = mapped_column(Float)
    avg_time_uv: Mapped[float | None] = mapped_column(Float)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SearchRankingEntry(Base):
    __tablename__ = "search_ranking_entry"
    __table_args__ = (UniqueConstraint("date", "list_type", "rank", name="uq_search_ranking_date_type_rank"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    list_type: Mapped[str] = mapped_column(String(16), index=True)
    rank: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(256))
    season_id: Mapped[str | None] = mapped_column(String(64))
    search_uv: Mapped[int | None] = mapped_column(Integer)
    search_vv: Mapped[int | None] = mapped_column(Integer)
    day_change: Mapped[float | None] = mapped_column(Float)
    week_change: Mapped[float | None] = mapped_column(Float)
    content_type: Mapped[str | None] = mapped_column(String(64))
    producer_region: Mapped[str | None] = mapped_column(String(128))
    genre: Mapped[str | None] = mapped_column(String(64))
    topic_tag: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[str | None] = mapped_column(String(32))
    source: Mapped[str] = mapped_column(String(256))
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class BlConsumptionSummary(Base):
    __tablename__ = "bl_consumption_summary"
    __table_args__ = (UniqueConstraint("period_start", "period_end", name="uq_bl_summary_period"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    total_play_vv: Mapped[int] = mapped_column(Integer)
    total_content_play_uv: Mapped[int] = mapped_column(Integer)
    bl_play_vv: Mapped[int] = mapped_column(Integer)
    bl_content_play_uv: Mapped[int] = mapped_column(Integer)
    bl_vv_share: Mapped[float] = mapped_column(Float)
    bl_avg_play_count: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(128))
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class BlConsumptionEntry(Base):
    __tablename__ = "bl_consumption_entry"
    __table_args__ = (UniqueConstraint("period_start", "period_end", "rank", name="uq_bl_entry_period_rank"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    rank: Mapped[int] = mapped_column(Integer)
    season_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(256))
    season_type: Mapped[str | None] = mapped_column(String(32))
    genre: Mapped[str | None] = mapped_column(String(64))
    content_type: Mapped[str | None] = mapped_column(String(64))
    topic_tags: Mapped[str | None] = mapped_column(String(512))
    producer_region: Mapped[str | None] = mapped_column(String(128))
    play_vv: Mapped[int] = mapped_column(Integer)
    play_uv: Mapped[int] = mapped_column(Integer)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GenreContributionSummary(Base):
    __tablename__ = "genre_contribution_summary"
    __table_args__ = (UniqueConstraint("period_start", "period_end", "genre_code", name="uq_genre_summary_period_code"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    genre_code: Mapped[str] = mapped_column(String(16), index=True)
    genre: Mapped[str] = mapped_column(String(32))
    total_play_vv: Mapped[int] = mapped_column(Integer)
    total_play_uv: Mapped[int] = mapped_column(Integer)
    top1_contribution: Mapped[float | None] = mapped_column(Float)
    top5_contribution: Mapped[float | None] = mapped_column(Float)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GenreContributionEntry(Base):
    __tablename__ = "genre_contribution_entry"
    __table_args__ = (UniqueConstraint("period_start", "period_end", "genre_code", "season_id", name="uq_genre_entry_period_code_season"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    genre_code: Mapped[str] = mapped_column(String(16), index=True)
    season_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(256))
    rank_vv: Mapped[int | None] = mapped_column(Integer)
    rank_uv: Mapped[int | None] = mapped_column(Integer)
    play_vv: Mapped[int] = mapped_column(Integer)
    play_uv: Mapped[int] = mapped_column(Integer)
    content_type: Mapped[str | None] = mapped_column(String(64))
    topic_tags: Mapped[str | None] = mapped_column(String(512))
    producer_region: Mapped[str | None] = mapped_column(String(128))
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PlaybackGrowthEntry(Base):
    __tablename__ = "playback_growth_entry"
    __table_args__ = (UniqueConstraint("period_start", "period_end", "season_id", name="uq_growth_period_season"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    season_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(256))
    genre: Mapped[str | None] = mapped_column(String(64))
    content_type: Mapped[str | None] = mapped_column(String(64))
    topic_tags: Mapped[str | None] = mapped_column(String(512))
    producer_region: Mapped[str | None] = mapped_column(String(128))
    play_vv: Mapped[int] = mapped_column(Integer)
    play_uv: Mapped[int] = mapped_column(Integer)
    current_rank: Mapped[int | None] = mapped_column(Integer)
    previous_play_vv: Mapped[int] = mapped_column(Integer)
    vv_delta: Mapped[int] = mapped_column(Integer)
    vv_change_rate: Mapped[float | None] = mapped_column(Float)
    previous_rank: Mapped[int | None] = mapped_column(Integer)
    new_top20: Mapped[int] = mapped_column(Integer)
    continuous_growth: Mapped[int] = mapped_column(Integer)
    growth_feature: Mapped[str] = mapped_column(String(16), index=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
