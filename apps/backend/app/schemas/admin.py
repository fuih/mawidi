from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlatformStats(BaseModel):
    total_doctors: int
    pending_doctors: int
    total_patients: int
    total_appointments: int
    active_doctors: int
    total_cities: int
    repeat_booking_rate: float

class DoctorVerificationUpdate(BaseModel):
    is_verified: bool
