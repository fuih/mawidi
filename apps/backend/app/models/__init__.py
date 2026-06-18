"""
Models package – import every model here so that:
  1. Alembic can auto-detect all tables.
  2. Relationship back-references resolve properly.
"""

from app.models.base import Base, TimestampMixin
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.working_hours import WorkingHours
from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_slot import BlockedSlot
from app.models.payment import Payment

__all__ = [
    "Base",
    "TimestampMixin",
    "Doctor",
    "Patient",
    "WorkingHours",
    "Appointment",
    "AppointmentStatus",
    "BlockedSlot",
    "Payment",
]
