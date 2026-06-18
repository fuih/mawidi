from datetime import date, time
from uuid import UUID
from pydantic import BaseModel, Field

class BlockedSlotCreate(BaseModel):
    blocked_date: date
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = Field(default=None, max_length=500)

class BlockedSlotResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    blocked_date: date
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = None

    class Config:
        from_attributes = True
