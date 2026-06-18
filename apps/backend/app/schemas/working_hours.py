"""
Working hours Pydantic schemas.
"""

import uuid
from datetime import time

from pydantic import BaseModel, Field


class WorkingHoursCreate(BaseModel):
    """Payload to create/update a single day's working hours."""

    day_of_week: int = Field(ge=0, le=6, description="0=Monday … 6=Sunday")
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(
        default=30, ge=10, le=60, description="Slot length in minutes (10-60)"
    )


class WorkingHoursResponse(BaseModel):
    """Working hours entry returned in API responses."""

    id: uuid.UUID
    doctor_id: uuid.UUID
    day_of_week: int
    start_time: time
    end_time: time
    slot_duration_minutes: int
    is_active: bool

    model_config = {"from_attributes": True}


class WorkingHoursUpdate(BaseModel):
    """Partial update for a single day's working hours. All fields optional."""

    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    slot_duration_minutes: int | None = Field(default=None, ge=10, le=60)
    is_active: bool | None = None


class WeeklyScheduleUpdate(BaseModel):
    """Set the entire weekly schedule at once (replaces all existing entries)."""

    schedule: list[WorkingHoursCreate]
