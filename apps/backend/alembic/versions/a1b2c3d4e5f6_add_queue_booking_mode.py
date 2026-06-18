"""Add queue-based booking mode

Revision ID: a1b2c3d4e5f6
Revises: eef23d862147
Create Date: 2026-06-10 23:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'eef23d862147'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add booking_mode and max_daily_queue to doctors
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.add_column(sa.Column('booking_mode', sa.String(length=20), nullable=False, server_default='time_based'))
        batch_op.add_column(sa.Column('max_daily_queue', sa.Integer(), nullable=True))

    # Add queue_number to appointments and make appointment_time nullable
    # Also drop the old unique constraint and add new partial indexes
    with op.batch_alter_table('appointments', recreate='always') as batch_op:
        batch_op.add_column(sa.Column('queue_number', sa.Integer(), nullable=True))
        batch_op.alter_column('appointment_time',
            existing_type=sa.Time(),
            nullable=True
        )
        # Drop the old unique constraint (if it exists)
        try:
            batch_op.drop_constraint('uq_doctor_date_time', type_='unique')
        except Exception:
            pass

    # Create partial unique indexes for time-based and queue-based modes
    # SQLite supports partial indexes via sqlite_where, Postgres via postgresql_where
    op.create_index(
        'uq_appt_time_slot',
        'appointments',
        ['doctor_id', 'appointment_date', 'appointment_time'],
        unique=True,
        sqlite_where=sa.text('appointment_time IS NOT NULL'),
        postgresql_where=sa.text('appointment_time IS NOT NULL'),
    )
    op.create_index(
        'uq_appt_queue_number',
        'appointments',
        ['doctor_id', 'appointment_date', 'queue_number'],
        unique=True,
        sqlite_where=sa.text('queue_number IS NOT NULL'),
        postgresql_where=sa.text('queue_number IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('uq_appt_queue_number', table_name='appointments')
    op.drop_index('uq_appt_time_slot', table_name='appointments')

    with op.batch_alter_table('appointments', recreate='always') as batch_op:
        batch_op.drop_column('queue_number')
        batch_op.alter_column('appointment_time',
            existing_type=sa.Time(),
            nullable=False
        )
        batch_op.create_unique_constraint(
            'uq_doctor_date_time',
            ['doctor_id', 'appointment_date', 'appointment_time']
        )

    with op.batch_alter_table('doctors') as batch_op:
        batch_op.drop_column('max_daily_queue')
        batch_op.drop_column('booking_mode')
