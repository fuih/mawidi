"""Add queue_cutoff_time to doctors

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-06-11 00:28:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.add_column(sa.Column('queue_cutoff_time', sa.Time(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.drop_column('queue_cutoff_time')
