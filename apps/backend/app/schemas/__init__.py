"""
Schemas package – re-export all schemas for convenient imports.
"""

from app.schemas.auth import (
    DoctorLogin,
    DoctorRegister,
    PatientLogin,
    PatientRegister,
    RefreshTokenRequest,
    TokenData,
    TokenResponse,
)
from app.schemas.common import (
    AvailableSlot,
    AvailableSlotsResponse,
    City,
    MessageResponse,
    PaginationParams,
    Specialty,
)
from app.schemas.doctor import (
    DoctorDashboardProfile,
    DoctorProfileUpdate,
    DoctorPublicProfile,
    DoctorSearchResult,
)
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.schemas.working_hours import (
    WeeklyScheduleUpdate,
    WorkingHoursCreate,
    WorkingHoursResponse,
    WorkingHoursUpdate,
)

__all__ = [
    # Auth
    "DoctorRegister",
    "DoctorLogin",
    "PatientRegister",
    "PatientLogin",
    "TokenResponse",
    "TokenData",
    "RefreshTokenRequest",
    # Common
    "Specialty",
    "City",
    "MessageResponse",
    "PaginationParams",
    "AvailableSlot",
    "AvailableSlotsResponse",
    # Doctor
    "DoctorPublicProfile",
    "DoctorDashboardProfile",
    "DoctorProfileUpdate",
    "DoctorSearchResult",
    # Appointment
    "AppointmentCreate",
    "AppointmentResponse",
    "AppointmentStatusUpdate",
    "AppointmentListResponse",
    # Working hours
    "WorkingHoursCreate",
    "WorkingHoursResponse",
    "WorkingHoursUpdate",
    "WeeklyScheduleUpdate",
]
