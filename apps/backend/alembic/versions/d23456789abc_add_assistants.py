"""Add assistants

Revision ID: d23456789abc
Revises: 6c29d2e5a10d
Create Date: 2026-06-23 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd23456789abc'
down_revision: Union[str, None] = '6c29d2e5a10d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### assistants table ###
    op.create_table('assistants',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('doctor_id', sa.Uuid(), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assistants_doctor_id'), 'assistants', ['doctor_id'], unique=False)
    op.create_index(op.f('ix_assistants_email'), 'assistants', ['email'], unique=True)


def downgrade() -> None:
    # ### assistants ###
    op.drop_index(op.f('ix_assistants_email'), table_name='assistants')
    op.drop_index(op.f('ix_assistants_doctor_id'), table_name='assistants')
    op.drop_table('assistants')
