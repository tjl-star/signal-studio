"""add search conversion daily

Revision ID: 20260916_03
Revises: 20260916_02
"""
from alembic import op
import sqlalchemy as sa

revision = "20260916_03"
down_revision = "20260916_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "search_conversion_daily",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("into_search_click_uv", sa.Integer()),
        sa.Column("search_suc_uv", sa.Integer()),
        sa.Column("search_suc_uv_ratio", sa.Float()),
        sa.Column("result_content_click_uv", sa.Integer()),
        sa.Column("result_video_after_ad_play_start_uv", sa.Integer()),
        sa.Column("result_play_5mins_uv", sa.Integer()),
        sa.Column("ff_play_uv_rate", sa.Float()),
        sa.Column("play_5min_uv_rate", sa.Float()),
        sa.Column("result_play_time_uv", sa.Float()),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("date", name="uq_search_conversion_date"),
    )
    op.create_index("ix_search_conversion_daily_date", "search_conversion_daily", ["date"])


def downgrade() -> None:
    op.drop_index("ix_search_conversion_daily_date", table_name="search_conversion_daily")
    op.drop_table("search_conversion_daily")
