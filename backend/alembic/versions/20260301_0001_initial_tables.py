"""initial tables

Revision ID: 20260301_0001
Revises:
Create Date: 2026-03-01 09:15:00.000000
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260301_0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "analysis_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("facility_id", sa.String(length=120), nullable=True),
        sa.Column("worker_id", sa.String(length=120), nullable=True),
        sa.Column("session_id", sa.String(length=120), nullable=True),
        sa.Column("dominant_hex", sa.String(length=7), nullable=False),
        sa.Column("color_name_ja", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("processing_ms", sa.Integer(), nullable=False),
        sa.Column("alternatives", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analysis_logs_user_id", "analysis_logs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_analysis_logs_user_id", table_name="analysis_logs")
    op.drop_table("analysis_logs")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

