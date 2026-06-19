"""Add assistants and payments

Revision ID: f123456789ab
Revises: 5a0f5845b8d1
Create Date: 2026-06-18 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f123456789ab'
down_revision: Union[str, None] = '5a0f5845b8d1'
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

    # ### payments table ###
    op.create_table('payments',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('doctor_id', sa.Uuid(), nullable=False),
    sa.Column('checkout_id', sa.String(length=255), nullable=False),
    sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_checkout_id'), 'payments', ['checkout_id'], unique=True)
    op.create_index(op.f('ix_payments_doctor_id'), 'payments', ['doctor_id'], unique=False)


def downgrade() -> None:
    # ### payments ###
    op.drop_index(op.f('ix_payments_doctor_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_checkout_id'), table_name='payments')
    op.drop_table('payments')

    # ### assistants ###
    op.drop_index(op.f('ix_assistants_email'), table_name='assistants')
    op.drop_index(op.f('ix_assistants_doctor_id'), table_name='assistants')
    op.drop_table('assistants')
