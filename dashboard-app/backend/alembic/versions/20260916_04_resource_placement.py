"""add resource placement metrics

Revision ID: 20260916_04
Revises: 20260916_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20260916_04"
down_revision = "20260916_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("resource_placement_metric",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("resource_type", sa.String(16), nullable=False),
        sa.Column("date", sa.Date(), nullable=False), sa.Column("identity_key", sa.String(512), nullable=False),
        sa.Column("name", sa.String(512), nullable=False), sa.Column("channel", sa.String(64)), sa.Column("position", sa.String(128)), sa.Column("client", sa.String(64)),
        sa.Column("exposure_pv", sa.Integer()), sa.Column("exposure_uv", sa.Integer()), sa.Column("click_pv", sa.Integer()), sa.Column("click_uv", sa.Integer()),
        sa.Column("jump_pv", sa.Integer()), sa.Column("jump_uv", sa.Integer()), sa.Column("play_pv", sa.Integer()), sa.Column("play_uv", sa.Integer()),
        sa.Column("ctr", sa.Float()), sa.Column("conversion_rate", sa.Float()), sa.Column("play_rate", sa.Float()),
        sa.Column("source", sa.String(256), nullable=False), sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("resource_type", "date", "identity_key", name="uq_resource_type_date_identity"))
    op.create_index("ix_resource_placement_metric_resource_type", "resource_placement_metric", ["resource_type"])
    op.create_index("ix_resource_placement_metric_date", "resource_placement_metric", ["date"])
    op.create_index("ix_resource_placement_metric_channel", "resource_placement_metric", ["channel"])
    op.create_index("ix_resource_placement_metric_client", "resource_placement_metric", ["client"])


def downgrade() -> None:
    op.drop_table("resource_placement_metric")
