"""add search ranking"""
from alembic import op
import sqlalchemy as sa
revision="20260916_06";down_revision="20260916_05";branch_labels=None;depends_on=None
def upgrade():
    op.create_table("search_ranking_entry",sa.Column("id",sa.Integer(),primary_key=True),sa.Column("date",sa.Date(),nullable=False),sa.Column("list_type",sa.String(16),nullable=False),sa.Column("rank",sa.Integer(),nullable=False),sa.Column("title",sa.String(256),nullable=False),sa.Column("season_id",sa.String(64)),sa.Column("search_uv",sa.Integer()),sa.Column("search_vv",sa.Integer()),sa.Column("day_change",sa.Float()),sa.Column("week_change",sa.Float()),sa.Column("content_type",sa.String(64)),sa.Column("producer_region",sa.String(128)),sa.Column("genre",sa.String(64)),sa.Column("topic_tag",sa.String(512)),sa.Column("status",sa.String(32)),sa.Column("source",sa.String(256),nullable=False),sa.Column("synced_at",sa.DateTime(),nullable=False),sa.UniqueConstraint("date","list_type","rank",name="uq_search_ranking_date_type_rank"));op.create_index("ix_search_ranking_entry_date","search_ranking_entry",["date"]);op.create_index("ix_search_ranking_entry_list_type","search_ranking_entry",["list_type"])
def downgrade(): op.drop_table("search_ranking_entry")
