"""add home operations

Revision ID: 20260916_05
Revises: 20260916_04
"""
from alembic import op
import sqlalchemy as sa
revision="20260916_05";down_revision="20260916_04";branch_labels=None;depends_on=None
def upgrade():
    op.create_table("home_channel_metric",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("date",sa.Date(),nullable=False),sa.Column("channel",sa.String(64),nullable=False),*[sa.Column(x,sa.Integer()) for x in ("entry_uv","content_click_uv","detail_play_uv","play_5m_uv","effective_play_uv")],*[sa.Column(x,sa.Float()) for x in ("entry_click_rate","click_play_rate","detail_5m_rate","play_5m_effective_rate")],sa.Column("synced_at",sa.DateTime(),nullable=False),sa.UniqueConstraint("date","channel",name="uq_home_channel_date_channel"))
    op.create_index("ix_home_channel_metric_date","home_channel_metric",["date"]);op.create_index("ix_home_channel_metric_channel","home_channel_metric",["channel"])
    op.create_table("recommendation_metric",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("date",sa.Date(),nullable=False,unique=True),sa.Column("page",sa.String(64),nullable=False),sa.Column("source_type",sa.String(64),nullable=False),*[sa.Column(x,sa.Integer()) for x in ("front_tab_uv","content_exposure_uv","content_click_uv")],*[sa.Column(x,sa.Float()) for x in ("content_click_rate","ff_play_convert_rate","play_convert_rate","play_5min_rate_uv","avg_time_uv")],sa.Column("synced_at",sa.DateTime(),nullable=False));op.create_index("ix_recommendation_metric_date","recommendation_metric",["date"])
def downgrade(): op.drop_table("recommendation_metric");op.drop_table("home_channel_metric")
