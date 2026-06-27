"""
Doctor Pydantic schemas for public profiles, dashboard, and search results.
"""

import uuid
from datetime import datetime, time
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class DoctorPublicProfile(BaseModel):
    """Public-facing doctor profile visible to patients."""

    id: uuid.UUID
    first_name: str
    last_name: str
    first_name_ar: str | None = None
    last_name_ar: str | None = None
    gender: str | None = None
    specialty: str
    city: str
    address: str | None = None
    google_maps_url: str | None = None
    slug: str | None = None
    bio: str | None = None
    bio_ar: str | None = None
    profile_photo_url: str | None = None
    consultation_fee: Decimal | None = None
    booking_mode: Literal["time_based", "queue_based"] = "time_based"
    queue_cutoff_time: time | None = None

    model_config = {"from_attributes": True}


class DoctorDashboardProfile(DoctorPublicProfile):
    """Extended profile returned to the authenticated doctor (dashboard view)."""

    email: EmailStr
    phone: str
    is_active: bool
    is_verified: bool
    # System settings
    booking_mode: Literal["time_based", "queue_based"] = "time_based"
    max_daily_queue: int | None = None
    queue_cutoff_time: time | None = None
    auto_confirm_appointments: bool | None = None
    slug: str | None = None
    created_at: datetime
    subscription_status: str
    subscription_end_date: datetime | None

    model_config = {"from_attributes": True}


from app.schemas.common import NAME_REGEX, PHONE_REGEX

class DoctorProfileUpdate(BaseModel):
    """Fields a doctor can update on their own profile. All optional."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100, pattern=NAME_REGEX)
    last_name: str | None = Field(default=None, min_length=1, max_length=100, pattern=NAME_REGEX)
    first_name_ar: str | None = Field(default=None, max_length=100, pattern=NAME_REGEX)
    last_name_ar: str | None = Field(default=None, max_length=100, pattern=NAME_REGEX)
    gender: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, min_length=9, max_length=20, pattern=PHONE_REGEX)
    specialty: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    address: str | None = None
    google_maps_url: str | None = Field(default=None, max_length=500)
    slug: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    bio_ar: str | None = None
    profile_photo_url: str | None = None
    consultation_fee: Decimal | None = Field(default=None, ge=0)


class DoctorSearchResult(BaseModel):
    """Compact doctor card for search/list views."""

    id: uuid.UUID
    first_name: str
    last_name: str
    gender: str | None = None
    specialty: str
    city: str
    bio: str | None = None
    profile_photo_url: str | None = None
    consultation_fee: Decimal | None = None
    slug: str | None = None

    model_config = {"from_attributes": True}
