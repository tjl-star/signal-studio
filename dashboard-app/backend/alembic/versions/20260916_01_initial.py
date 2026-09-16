"""Create the local overview and sync tables."""

from alembic import op
import sqlalchemy as sa


revision = "20260916_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "daily_overview_metric",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("client", sa.String(length=32), nullable=False),
        sa.Column("device_dau", sa.Integer()),
        sa.Column("new_device", sa.Integer()),
        sa.Column("play_rate", sa.Float()),
        sa.Column("avg_watch_duration", sa.Float()),
        sa.Column("avg_play_count", sa.Float()),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("date", "client", name="uq_overview_date_client"),
    )
    op.create_index("ix_overview_date", "daily_overview_metric", ["date"])
    op.create_index("ix_overview_client", "daily_overview_metric", ["client"])
    op.create_table(
        "sync_run",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dataset", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_sync_run_dataset", "sync_run", ["dataset"])


def downgrade() -> None:
    op.drop_index("ix_sync_run_dataset", table_name="sync_run")
    op.drop_table("sync_run")
    op.drop_index("ix_overview_client", table_name="daily_overview_metric")
    op.drop_index("ix_overview_date", table_name="daily_overview_metric")
    op.drop_table("daily_overview_metric")
