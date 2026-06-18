"""
Patient ORM model.
Supports both registered and guest patients (hybrid approach).
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment


class Patient(TimestampMixin, Base):
    """Represents a patient – may be a registered user or created during guest booking."""

    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Email and password are optional – guest patients only provide name + phone.
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # ── Relationships ────────────────────────────────────────
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="patient", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Patient {self.first_name} {self.last_name} ({self.phone})>"
