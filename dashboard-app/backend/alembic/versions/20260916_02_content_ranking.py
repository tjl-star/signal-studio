"""Create the content ranking table."""

from alembic import op
import sqlalchemy as sa


revision = "20260916_02"
down_revision = "20260916_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "content_ranking_entry",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("list_type", sa.String(length=16), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("season_id", sa.String(length=64)),
        sa.Column("play_uv", sa.Integer()),
        sa.Column("play_vv", sa.Integer()),
        sa.Column("day_change_rate", sa.Float()),
        sa.Column("day_change_text", sa.String(length=32)),
        sa.Column("week_change_rate", sa.Float()),
        sa.Column("week_change_text", sa.String(length=32)),
        sa.Column("collection_type", sa.String(length=32)),
        sa.Column("content_category", sa.String(length=64)),
        sa.Column("genre_tags", sa.String(length=512)),
        sa.Column("ranking_status", sa.String(length=32)),
        sa.Column("data_status", sa.String(length=32), nullable=False),
        sa.Column("source_interface", sa.String(length=64), nullable=False),
        sa.Column("limitation", sa.String(length=512)),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("date", "list_type", "rank", name="uq_content_ranking_date_type_rank"),
    )
    op.create_index("ix_content_ranking_date", "content_ranking_entry", ["date"])
    op.create_index("ix_content_ranking_list_type", "content_ranking_entry", ["list_type"])
    op.create_index("ix_content_ranking_season_id", "content_ranking_entry", ["season_id"])


def downgrade() -> None:
    op.drop_index("ix_content_ranking_season_id", table_name="content_ranking_entry")
    op.drop_index("ix_content_ranking_list_type", table_name="content_ranking_entry")
    op.drop_index("ix_content_ranking_date", table_name="content_ranking_entry")
    op.drop_table("content_ranking_entry")
