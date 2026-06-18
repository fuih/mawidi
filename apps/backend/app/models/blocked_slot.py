"""
BlockedSlot ORM model.
Allows doctors to block entire days or specific time ranges.
"""

import uuid
from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Text, Time
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class BlockedSlot(Base):
    """A blocked period for a doctor – either a full day or a time range."""

    __tablename__ = "blocked_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    blocked_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # When both are NULL the entire day is blocked.
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relationships ────────────────────────────────────────
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="blocked_slots")

    def __repr__(self) -> str:
        return f"<BlockedSlot {self.blocked_date} {self.start_time}-{self.end_time}>"
