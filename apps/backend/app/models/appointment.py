"""
Appointment ORM model with status enum.
"""

import enum
import uuid
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy import text
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.doctor import Doctor
    from app.models.patient import Patient


class AppointmentStatus(str, enum.Enum):
    """Lifecycle states for an appointment."""

    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


class Appointment(TimestampMixin, Base):
    """A single appointment between a doctor and a patient (or guest)."""

    __tablename__ = "appointments"
    __table_args__ = (
        # Partial index: prevents double-booking in time-based mode
        Index(
            "uq_appt_time_slot",
            "doctor_id",
            "appointment_date",
            "appointment_time",
            unique=True,
            sqlite_where=text("appointment_time IS NOT NULL"),
        ),
        # Partial index: prevents duplicate queue numbers in queue-based mode
        Index(
            "uq_appt_queue_number",
            "doctor_id",
            "appointment_date",
            "queue_number",
            unique=True,
            sqlite_where=text("queue_number IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ── Foreign keys ─────────────────────────────────────────
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Patient info (always stored, even for registered patients) ──
    patient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    patient_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    patient_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Scheduling ───────────────────────────────────────────
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    appointment_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    queue_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Details ──────────────────────────────────────────────
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status", create_constraint=True),
        default=AppointmentStatus.pending,
        nullable=False,
        index=True,
    )
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    cancellation_token: Mapped[str | None] = mapped_column(
        String(64), 
        default=lambda: uuid.uuid4().hex,
        nullable=True, 
        unique=True,
        index=True
    )

    # ── Relationships ────────────────────────────────────────
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="appointments")
    patient: Mapped["Patient | None"] = relationship(
        "Patient", back_populates="appointments"
    )

    def __repr__(self) -> str:
        if self.queue_number is not None:
            return (
                f"<Appointment {self.appointment_date} queue=#{self.queue_number} "
                f"status={self.status.value}>"
            )
        return (
            f"<Appointment {self.appointment_date} {self.appointment_time} "
            f"status={self.status.value}>"
        )
