"""
Authentication service – handles registration, login, and token refresh for
both doctors and patients.
"""

import uuid
import re

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assistant import Assistant
from app.models.admin import Admin
from app.schemas.auth import (
    DoctorRegister,
    PatientRegister,
    TokenResponse,
)


# ── Doctor Auth ──────────────────────────────────────────────────

async def register_doctor(db: AsyncSession, data: DoctorRegister) -> dict:
    """Register a new doctor account.

    Steps:
        1. Check that the email is not already taken.
        2. Hash the password.
        3. Persist the Doctor row (unverified).
        4. Return a success message — the doctor cannot log in until an admin verifies them.
    """
    # Check for existing email
    existing = await db.execute(select(Doctor).where(Doctor.email == data.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A doctor with this email already exists",
        )

    # Generate slug
    base_slug = f"dr-{re.sub(r'[^a-z0-9]+', '-', data.first_name.lower())}-{re.sub(r'[^a-z0-9]+', '-', data.last_name.lower())}".strip('-')
    slug = base_slug
    suffix = 1
    while True:
        slug_exists = await db.execute(select(Doctor).where(Doctor.slug == slug))
        if not slug_exists.scalar_one_or_none():
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    from datetime import datetime, timezone, timedelta
    doctor = Doctor(
        id=uuid.uuid4(),
        email=data.email,
        slug=slug,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        specialty=data.specialty,
        city=data.city,
        gender=data.gender,
        is_active=True,
        is_verified=False,
        subscription_status="trial",
        subscription_end_date=(datetime.now(timezone.utc) + timedelta(days=14)).replace(tzinfo=None)
    )

    try:
        db.add(doctor)
        await db.commit()
        await db.refresh(doctor)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A doctor with this email already exists",
        )

    return {"message": "Votre compte a été créé avec succès. Il sera activé après vérification par notre équipe."}


async def authenticate_doctor(
    db: AsyncSession, email: str, password: str
) -> TokenResponse:
    """Verify doctor credentials and return token pair.

    Raises:
        HTTPException 401 on invalid email or password.
    """
    result = await db.execute(select(Doctor).where(Doctor.email == email))
    doctor = result.scalar_one_or_none()

    if doctor and verify_password(password, doctor.password_hash):
        # Block unverified doctors
        if not doctor.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Votre compte est en attente de vérification par notre équipe. Vous recevrez un e-mail une fois approuvé.",
            )
        token_data = {"sub": str(doctor.id), "type": "doctor"}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
    
    # Fallback to check if it's an Assistant
    from app.models.assistant import Assistant
    ast_result = await db.execute(select(Assistant).where(Assistant.email == email))
    assistant = ast_result.scalar_one_or_none()

    if assistant and verify_password(password, assistant.password_hash):
        token_data = {"sub": str(assistant.id), "type": "assistant"}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )


# ── Patient Auth ─────────────────────────────────────────────────

async def register_patient(db: AsyncSession, data: PatientRegister) -> TokenResponse:
    """Register a new patient account.

    If the patient provides a password, they become a registered user.
    Otherwise, the account is minimal (phone-based lookup only).
    """
    # If email provided, check uniqueness
    if data.email:
        existing = await db.execute(
            select(Patient).where(Patient.email == data.email)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A patient with this email already exists",
            )

    patient = Patient(
        id=uuid.uuid4(),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        password_hash=get_password_hash(data.password) if data.password else None,
    )

    try:
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A patient with this email already exists",
        )

    token_data = {"sub": str(patient.id), "type": "patient"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


async def authenticate_patient(
    db: AsyncSession, phone: str, password: str
) -> TokenResponse:
    """Verify patient credentials (phone + password) and return token pair.

    Raises:
        HTTPException 401 on invalid phone or password.
    """
    result = await db.execute(select(Patient).where(Patient.phone == phone))
    patient = result.scalar_one_or_none()

    if patient is None or patient.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )

    if not verify_password(password, patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password",
        )

    token_data = {"sub": str(patient.id), "type": "patient"}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


# ── Token Refresh ────────────────────────────────────────────────

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Validate a refresh token and issue a new access + refresh pair.

    Raises:
        HTTPException 401 if the refresh token is invalid or expired.
    """
    payload = verify_token(refresh_token)
    if payload is None or payload.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id_str = payload.get("sub")
    user_type = payload.get("type")

    try:
        import uuid
        user_uuid = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    if user_type == "doctor":
        result = await db.execute(select(Doctor).where(Doctor.id == user_uuid))
        user = result.scalar_one_or_none()
    elif user_type == "patient":
        result = await db.execute(select(Patient).where(Patient.id == user_uuid))
        user = result.scalar_one_or_none()
    elif user_type == "assistant":
        result = await db.execute(select(Assistant).where(Assistant.id == user_uuid))
        user = result.scalar_one_or_none()
    elif user_type == "admin":
        result = await db.execute(select(Admin).where(Admin.id == user_uuid))
        user = result.scalar_one_or_none()
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    token_data = {"sub": str(user_uuid), "type": user_type}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )
