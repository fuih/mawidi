"""
WorkingHours ORM model.
Represents a doctor's recurring weekly schedule for a given day.
"""

import uuid
from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, SmallInteger, Time, UniqueConstraint
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class WorkingHours(Base):
    """Weekly recurring schedule entry for a single day."""

    __tablename__ = "working_hours"
    __table_args__ = (
        UniqueConstraint("doctor_id", "day_of_week", name="uq_doctor_day"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 0 = Monday … 6 = Sunday  (ISO weekday convention)
    day_of_week: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(
        Integer, default=30, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="working_hours")

    def __repr__(self) -> str:
        return (
            f"<WorkingHours day={self.day_of_week} "
            f"{self.start_time}-{self.end_time} ({self.slot_duration_minutes}min)>"
        )
