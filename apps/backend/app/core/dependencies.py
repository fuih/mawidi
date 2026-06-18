"""
FastAPI dependencies for authentication and authorization.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.session import get_db
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.admin import Admin
from app.models.assistant import Assistant

# Token URL points to the doctor login endpoint (used by Swagger UI).
oauth2_doctor_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=True
)
oauth2_patient_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/patient/login", auto_error=False
)
oauth2_patient_strict_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/patient/login", auto_error=True
)
oauth2_admin_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/admin/login", auto_error=True
)
oauth2_clinic_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=True # Shared login for doctors and assistants
)


async def get_token_from_request(request: Request) -> str:
    """Extract token from cookie (primary) or Authorization header (fallback for Swagger UI)."""
    token = request.cookies.get("access_token")
    if token:
        return token
    
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def verify_csrf(request: Request):
    """Verify CSRF token for state-changing requests."""
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("x-csrf-token")
        
        # Bypass CSRF for login/register endpoints and Swagger UI (which doesn't send cookies automatically)
        if not csrf_cookie and not request.cookies.get("access_token"):
            return
            
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            raise HTTPException(status_code=403, detail="CSRF token mismatch")

async def get_current_doctor(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _csrf: None = Depends(verify_csrf)
) -> Doctor:
    """Extract and validate the current doctor from the JWT."""
    token = await get_token_from_request(request)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None or payload.get("token_type") != "access" or payload.get("type") != "doctor":
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        doctor_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(Doctor).where(Doctor.id == doctor_uuid))
    doctor = result.scalar_one_or_none()
    if doctor is None:
        raise credentials_exception

    return doctor


async def get_current_active_doctor(
    doctor: Doctor = Depends(get_current_doctor),
) -> Doctor:
    """Ensure the authenticated doctor account is active."""
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor account is deactivated",
        )
    return doctor

async def get_current_clinic_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _csrf: None = Depends(verify_csrf)
) -> Doctor:
    """Extract and validate the current user (Doctor or Assistant)."""
    token = await get_token_from_request(request)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None or payload.get("token_type") != "access":
        raise credentials_exception

    user_type = payload.get("type")
    user_id_str = payload.get("sub")
    if user_id_str is None or user_type not in ["doctor", "assistant"]:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    if user_type == "doctor":
        result = await db.execute(select(Doctor).where(Doctor.id == user_uuid))
        doctor = result.scalar_one_or_none()
        if doctor is None or not doctor.is_active:
            raise credentials_exception
            
        if not doctor.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Votre compte est en attente de vérification.",
            )
            
        return doctor

    if user_type == "assistant":
        result = await db.execute(select(Assistant).where(Assistant.id == user_uuid))
        assistant = result.scalar_one_or_none()
        if assistant is None or not assistant.is_active:
            raise credentials_exception
        
        # Return the doctor associated with this assistant
        doc_result = await db.execute(select(Doctor).where(Doctor.id == assistant.doctor_id))
        doctor = doc_result.scalar_one_or_none()
        if doctor is None or not doctor.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The doctor associated with this account is deactivated",
            )
        return doctor

    raise credentials_exception


async def get_optional_patient(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Patient | None:
    """Optionally extract a patient from the JWT token."""
    try:
        token = await get_token_from_request(request)
    except HTTPException:
        return None

    payload = verify_token(token)
    if payload is None:
        return None

    if payload.get("type") != "patient":
        return None

    user_id: str | None = payload.get("sub")
    if user_id is None:
        return None

    try:
        patient_uuid = uuid.UUID(user_id)
    except ValueError:
        return None

    result = await db.execute(select(Patient).where(Patient.id == patient_uuid))
    return result.scalar_one_or_none()

async def get_current_patient(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _csrf: None = Depends(verify_csrf)
) -> Patient:
    """Strictly extract a patient from the JWT token (for patient dashboard)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    patient = await get_optional_patient(request, db)
    if patient is None:
        raise credentials_exception
    return patient

async def get_current_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _csrf: None = Depends(verify_csrf)
) -> Admin:
    """Extract and validate the current admin from the JWT token."""
    token = await get_token_from_request(request)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    if payload.get("type") != "admin":
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        admin_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(Admin).where(Admin.id == admin_uuid))
    admin = result.scalar_one_or_none()
    
    if admin is None or not admin.is_active:
        raise credentials_exception

    return admin
