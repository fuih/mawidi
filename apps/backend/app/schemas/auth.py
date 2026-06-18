"""
Auth-related Pydantic schemas (registration, login, tokens).
"""

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import NAME_REGEX, PHONE_REGEX


# ── Doctor Auth ──────────────────────────────────────────────────

class DoctorRegister(BaseModel):
    """Payload for doctor self-registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    last_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    specialty: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    gender: str | None = Field(default=None, max_length=20)


class DoctorLogin(BaseModel):
    """Payload for doctor login."""

    email: EmailStr
    password: str


# ── Patient Auth ─────────────────────────────────────────────────

class PatientRegister(BaseModel):
    """Payload for patient registration (optional account)."""

    first_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    last_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class PatientLogin(BaseModel):
    """Payload for patient login (phone + password)."""

    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    password: str


# ── Tokens ───────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token pair returned on successful auth."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded JWT payload (used internally)."""

    sub: str  # user UUID
    type: str  # "doctor" or "patient" or "assistant"

class AssistantRegister(BaseModel):
    """Payload to create an assistant account."""
    first_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    last_name: str = Field(min_length=1, max_length=100, pattern=NAME_REGEX)
    phone: str = Field(min_length=9, max_length=20, pattern=PHONE_REGEX)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

from uuid import UUID
class AssistantResponse(BaseModel):
    id: UUID
    doctor_id: UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    is_active: bool

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    """Payload for token refresh."""

    refresh_token: str
