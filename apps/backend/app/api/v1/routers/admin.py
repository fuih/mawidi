import uuid
from typing import List
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.schemas.admin import AdminLogin, PlatformStats, DoctorVerificationUpdate
from app.schemas.doctor import DoctorDashboardProfile
from app.schemas.auth import TokenResponse
from app.core.dependencies import get_current_admin
from app.services.email_service import send_doctor_approved_email

from app.core.config import settings
from app.services import auth_service

router = APIRouter()

@router.get("/seed-initial-admin")
async def seed_initial_admin(db: AsyncSession = Depends(get_db)):
    """Seed the first admin. Only works if no admins exist in the database."""
    # Check if any admin exists
    result = await db.execute(select(Admin).limit(1))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="An admin already exists. Cannot seed again.")
    
    from app.core.security import get_password_hash
    admin = Admin(
        id=uuid.uuid4(),
        email="admin@tabibak.pro",
        password_hash=get_password_hash("admin123"),
        is_active=True
    )
    db.add(admin)
    await db.commit()
    return {"message": "Admin created successfully! Email: admin@tabibak.pro, Password: admin123"}

@router.post("/login")
async def login_admin(
    response: Response,
    data: AdminLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate an admin using email/password."""
    tokens = await auth_service.authenticate_admin(db, data.email, data.password)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    import os
    is_prod = settings.ENV == "production" or os.environ.get("RENDER") == "true"
    cookie_samesite = "none" if is_prod else "lax"
    
    # Set HttpOnly cookies for JWTs
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=is_prod, samesite=cookie_samesite, max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_prod, samesite=cookie_samesite, max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    
    # Set CSRF token
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=is_prod, samesite=cookie_samesite)
    
    return {"message": "Successfully logged in", "type": "admin"}

@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # Get total doctors
    doctors_result = await db.execute(select(func.count()).select_from(Doctor))
    total_doctors = doctors_result.scalar_one() or 0
    
    # Get pending doctors
    pending_result = await db.execute(
        select(func.count()).select_from(Doctor).where(Doctor.is_verified == False)
    )
    pending_doctors = pending_result.scalar_one() or 0
    
    # Get active doctors
    active_result = await db.execute(
        select(func.count()).select_from(Doctor).where(
            Doctor.is_verified == True, Doctor.is_active == True
        )
    )
    active_doctors = active_result.scalar_one() or 0
    
    # Get total cities (normalized)
    cities_result = await db.execute(
        select(func.count(func.distinct(func.lower(func.trim(Doctor.city)))))
        .where(Doctor.city != None, Doctor.city != "")
    )
    total_cities = cities_result.scalar_one() or 0
    
    # Get total patients (registered)
    patients_result = await db.execute(select(func.count()).select_from(Patient))
    total_patients = patients_result.scalar_one() or 0
    
    # Get total appointments
    appointments_result = await db.execute(select(func.count()).select_from(Appointment))
    total_appointments = appointments_result.scalar_one() or 0
    
    # Calculate Repeat Booking Rate
    # Unique patient phones with > 1 appointment
    repeat_subquery = (
        select(Appointment.patient_phone)
        .group_by(Appointment.patient_phone)
        .having(func.count(Appointment.id) > 1)
        .subquery()
    )
    
    repeat_count_result = await db.execute(select(func.count()).select_from(repeat_subquery))
    repeat_patients = repeat_count_result.scalar_one() or 0
    
    # Total unique patient phones who have booked at all
    unique_phones_result = await db.execute(
        select(func.count(func.distinct(Appointment.patient_phone)))
    )
    total_unique_bookers = unique_phones_result.scalar_one() or 0
    
    repeat_booking_rate = 0.0
    if total_unique_bookers > 0:
        repeat_booking_rate = round((repeat_patients / total_unique_bookers) * 100, 2)
    
    return PlatformStats(
        total_doctors=total_doctors,
        pending_doctors=pending_doctors,
        total_patients=total_patients,
        total_appointments=total_appointments,
        active_doctors=active_doctors,
        total_cities=total_cities,
        repeat_booking_rate=repeat_booking_rate
    )

@router.get("/doctors", response_model=List[DoctorDashboardProfile])
async def list_all_doctors(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Doctor))
    return result.scalars().all()

@router.patch("/doctors/{doctor_id}/verify", response_model=DoctorDashboardProfile)
async def verify_doctor(
    doctor_id: uuid.UUID,
    data: DoctorVerificationUpdate,
    background_tasks: BackgroundTasks,
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    was_verified = doctor.is_verified
    doctor.is_verified = data.is_verified
    await db.commit()
    await db.refresh(doctor)

    # If the doctor was just approved (transitioned from False to True), send the welcome email
    if data.is_verified and not was_verified:
        doctor_name = f"{doctor.first_name} {doctor.last_name}"
        slug = doctor.slug or ""
        background_tasks.add_task(send_doctor_approved_email, doctor.email, doctor_name, slug)

    return doctor
