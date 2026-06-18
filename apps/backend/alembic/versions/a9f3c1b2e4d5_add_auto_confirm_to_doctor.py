"""add_auto_confirm_to_doctor

Revision ID: a9f3c1b2e4d5
Revises: 5a0f5845b8d1, c3d4e5f6a7b8
Create Date: 2026-06-12
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a9f3c1b2e4d5'
down_revision: Union[str, None] = ('5a0f5845b8d1', 'c3d4e5f6a7b8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.add_column(
            sa.Column('auto_confirm_appointments', sa.Boolean(), nullable=False, server_default=sa.false())
        )

def downgrade() -> None:
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.drop_column('auto_confirm_appointments')
