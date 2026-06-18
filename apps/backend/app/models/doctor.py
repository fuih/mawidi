"""
Doctor ORM model.
"""

import uuid
from datetime import time
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, Numeric, String, Text, Time
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.blocked_slot import BlockedSlot
    from app.models.working_hours import WorkingHours


class Doctor(TimestampMixin, Base):
    """Represents a doctor/practitioner on the platform."""

    __tablename__ = "doctors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Name (Latin + Arabic) ────────────────────────────────
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_name_ar: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name_ar: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ── Contact & location ───────────────────────────────────
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Optional public sharing URL slug (e.g. "dr-ahmed")
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)

    # ── Profile extras ───────────────────────────────────────
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    consultation_fee: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    # ── Booking mode ─────────────────────────────────────────
    booking_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="time_based"
    )
    max_daily_queue: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Stop accepting new queue bookings after this time each day (queue mode only)
    queue_cutoff_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    # Auto-confirm new bookings without manual approval
    auto_confirm_appointments: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Status flags ─────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Subscription & Billing ───────────────────────────────
    subscription_status: Mapped[str] = mapped_column(String(20), default="trial", nullable=False)
    from datetime import datetime
    subscription_end_date: Mapped[datetime | None] = mapped_column(nullable=True)

    # ── Relationships ────────────────────────────────────────
    working_hours: Mapped[list["WorkingHours"]] = relationship(
        "WorkingHours", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin"
    )
    assistants: Mapped[list["Assistant"]] = relationship(
        "Assistant", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin"
    )
    blocked_slots: Mapped[list["BlockedSlot"]] = relationship(
        "BlockedSlot", back_populates="doctor", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Doctor {self.first_name} {self.last_name} ({self.specialty})>"
