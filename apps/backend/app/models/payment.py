import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Numeric, String, ForeignKey, DateTime
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class Payment(TimestampMixin, Base):
    """Tracks Chargily checkout sessions and subscription payments."""

    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    checkout_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    # Status can be 'pending', 'paid', 'failed', 'canceled'
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")

    def __repr__(self) -> str:
        return f"<Payment {self.id} checkout={self.checkout_id} status={self.status}>"
