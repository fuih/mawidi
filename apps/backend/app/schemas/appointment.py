"""
Appointment Pydantic schemas.
"""

import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, EmailStr, Field

from app.models.appointment import AppointmentStatus


from app.schemas.common import NAME_REGEX, PHONE_REGEX


class AppointmentCreate(BaseModel):
    """Payload to book a new appointment (patient-facing)."""

    doctor_id: uuid.UUID
    appointment_date: date
    appointment_time: time | None = None  # Optional: not used in queue-based mode
    patient_name: str = Field(min_length=1, max_length=200, pattern=NAME_REGEX)
    patient_phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    patient_email: EmailStr | None = None
    reason: str | None = None
    patient_id: uuid.UUID | None = None  # set automatically for registered patients


class ManualAppointmentCreate(BaseModel):
    """Payload for doctor manually booking a patient. Doctor ID is inferred."""

    appointment_date: date
    appointment_time: time | None = None
    patient_name: str = Field(min_length=1, max_length=200, pattern=NAME_REGEX)
    patient_phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    patient_email: EmailStr | None = None
    reason: str | None = None


class AppointmentResponse(BaseModel):
    """Full appointment details returned in API responses."""

    id: uuid.UUID
    doctor_id: uuid.UUID
    patient_id: uuid.UUID | None = None
    patient_name: str
    patient_phone: str
    patient_email: str | None = None
    appointment_date: date
    appointment_time: time | None = None
    duration_minutes: int
    queue_number: int | None = None
    reason: str | None = None
    status: AppointmentStatus
    cancellation_reason: str | None = None
    notes: str | None = None
    reminder_sent: bool
    is_new_patient: bool = False
    created_at: datetime
    updated_at: datetime

    # Denormalized doctor info for convenience
    doctor_first_name: str | None = None
    doctor_last_name: str | None = None
    doctor_specialty: str | None = None
    doctor_city: str | None = None

    model_config = {"from_attributes": True}


class AppointmentStatusUpdate(BaseModel):
    """Payload to change an appointment's status (doctor-facing)."""

    status: AppointmentStatus
    cancellation_reason: str | None = None

class AppointmentReschedule(BaseModel):
    """Payload to reschedule an appointment (doctor-facing)."""
    appointment_date: date
    appointment_time: time | None = None

class AppointmentListResponse(BaseModel):
    """Paginated list of appointments."""

    items: list[AppointmentResponse]
    total: int
    page: int
    per_page: int

class PatientStats(BaseModel):
    """Patient statistics summary."""
    total: int
    no_shows: int
    rate: float

class DashboardTodayResponse(BaseModel):
    """Response payload for the doctor's today view, including pre-calculated patient stats."""
    appointments: list[AppointmentResponse]
    patient_stats: dict[str, PatientStats]

class GuestCancelRequest(BaseModel):
    """Payload to cancel an appointment as a guest."""
    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
