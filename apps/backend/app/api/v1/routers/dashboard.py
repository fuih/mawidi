from datetime import date, datetime, time, timedelta, timezone
from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_

from app.db.session import get_db
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus
from app.models.working_hours import WorkingHours
from app.schemas import doctor as doctor_schemas
from app.schemas import appointment as appointment_schemas
from app.schemas import working_hours as working_hours_schemas
from app.core.dependencies import get_current_clinic_user
from app.services import appointment_service
from app.models.blocked_slot import BlockedSlot
from pydantic import BaseModel

router = APIRouter()

@router.get("/profile", response_model=doctor_schemas.DoctorDashboardProfile)
async def get_own_profile(
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get the currently logged-in doctor's full profile."""
    return current_doctor


class AutoConfirmUpdate(BaseModel):
    auto_confirm: bool


@router.patch("/settings/auto-confirm")
async def toggle_auto_confirm(
    data: AutoConfirmUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Toggle auto-confirmation of new appointments."""
    current_doctor.auto_confirm_appointments = data.auto_confirm
    await db.commit()
    await db.refresh(current_doctor)
    return {"auto_confirm_appointments": current_doctor.auto_confirm_appointments}


@router.put("/profile", response_model=doctor_schemas.DoctorDashboardProfile)
async def update_own_profile(
    profile_update: doctor_schemas.DoctorProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Update doctor's profile."""
    update_data = profile_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_doctor, field, value)
        
    db.add(current_doctor)
    await db.commit()
    await db.refresh(current_doctor)
    
    return current_doctor


from fastapi import UploadFile, File
from app.services.storage_service import save_profile_photo

@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Upload and update the doctor's profile photo."""
    photo_url = await save_profile_photo(file, str(current_doctor.id), current_doctor.profile_photo_url)
    
    current_doctor.profile_photo_url = photo_url
    db.add(current_doctor)
    await db.commit()
    await db.refresh(current_doctor)
    
    return {"profile_photo_url": current_doctor.profile_photo_url}


@router.get("/appointments", response_model=List[appointment_schemas.AppointmentResponse])
async def get_appointments(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[AppointmentStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get all appointments for the current doctor with optional filters."""
    query = select(Appointment).where(Appointment.doctor_id == current_doctor.id)
    
    if start_date:
        query = query.where(Appointment.appointment_date >= start_date)
    if end_date:
        query = query.where(Appointment.appointment_date <= end_date)
    if status:
        query = query.where(Appointment.status == status)
        
    query = query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/appointments/today", response_model=appointment_schemas.DashboardTodayResponse)
async def get_today_appointments(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get today's appointments and patient stats for the dashboard."""
    return await appointment_service.get_today_appointments(db, current_doctor.id)


@router.get("/appointments/monthly-counts", response_model=dict[str, int])
async def get_monthly_appointment_counts(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get daily appointment counts for a specific month."""
    return await appointment_service.get_monthly_appointment_counts(
        db, current_doctor.id, year, month
    )

@router.get("/stats")
async def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get analytics stats for the dashboard."""
    # We will implement get_analytics_stats in appointment_service.py
    return await appointment_service.get_analytics_stats(
        db, current_doctor.id, start_date, end_date
    )

@router.patch("/appointments/{appointment_id}/status", response_model=appointment_schemas.AppointmentResponse)
async def update_appointment_status(
    appointment_id: UUID,
    status_update: appointment_schemas.AppointmentStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Update the status of an appointment (e.g. mark as completed or cancelled)."""
    appointment = await appointment_service.update_appointment_status(
        db, 
        appointment_id, 
        current_doctor.id, 
        status_update,
        background_tasks
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or does not belong to you")
        
    return appointment

@router.patch("/appointments/{appointment_id}/reschedule", response_model=appointment_schemas.AppointmentResponse)
async def reschedule_appointment(
    appointment_id: UUID,
    reschedule_data: appointment_schemas.AppointmentReschedule,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Reschedule an appointment to a new date/time."""
    appointment = await appointment_service.reschedule_appointment(
        db,
        appointment_id,
        current_doctor.id,
        reschedule_data,
        background_tasks
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or does not belong to you")
        
    return appointment


@router.get("/working-hours", response_model=List[working_hours_schemas.WorkingHoursResponse])
async def get_working_hours(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Get the current doctor's weekly schedule."""
    query = select(WorkingHours).where(WorkingHours.doctor_id == current_doctor.id).order_by(WorkingHours.day_of_week)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/working-hours", response_model=List[working_hours_schemas.WorkingHoursResponse])
async def set_working_hours(
    schedule: List[working_hours_schemas.WorkingHoursCreate],
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user)
):
    """Update the weekly schedule. This replaces the existing schedule."""
    # First, delete existing schedule
    query = select(WorkingHours).where(WorkingHours.doctor_id == current_doctor.id)
    result = await db.execute(query)
    existing_hours = result.scalars().all()
    for hours in existing_hours:
        await db.delete(hours)
        
    await db.flush()
        
    # Then add new ones
    new_hours = []
    for item in schedule:
        wh = WorkingHours(
            doctor_id=current_doctor.id,
            day_of_week=item.day_of_week,
            start_time=item.start_time,
            end_time=item.end_time,
            slot_duration_minutes=item.slot_duration_minutes
        )
        db.add(wh)
        new_hours.append(wh)
        
    await db.commit()
    
    # Refresh to return
    for wh in new_hours:
        await db.refresh(wh)
        
    return new_hours




class BookingModeUpdate(doctor_schemas.BaseModel):
    booking_mode: Literal["time_based", "queue_based"]
    max_daily_queue: Optional[int] = None
    queue_cutoff_time: Optional[str] = None  # "HH:MM" or null


@router.patch("/booking-mode")
async def update_booking_mode(
    data: BookingModeUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Update the doctor's booking mode and queue settings."""
    current_doctor.booking_mode = data.booking_mode
    current_doctor.max_daily_queue = data.max_daily_queue
    # Parse cutoff time string "HH:MM" → time object
    if data.queue_cutoff_time:
        h, m = data.queue_cutoff_time.split(":")
        current_doctor.queue_cutoff_time = time(int(h), int(m))
    else:
        current_doctor.queue_cutoff_time = None
    await db.commit()
    await db.refresh(current_doctor)
    return {
        "booking_mode": current_doctor.booking_mode,
        "max_daily_queue": current_doctor.max_daily_queue,
        "queue_cutoff_time": current_doctor.queue_cutoff_time.strftime("%H:%M") if current_doctor.queue_cutoff_time else None,
    }


@router.post("/block-rest-of-day")
async def block_rest_of_day(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Instantly block the rest of today from being booked."""
    local_tz = timezone(timedelta(hours=1))
    now = datetime.now(local_tz)
    today = now.date()
    current_time = now.time()

    block = BlockedSlot(
        id=__import__('uuid').uuid4(),
        doctor_id=current_doctor.id,
        blocked_date=today,
        start_time=current_time,
        end_time=None, # Rest of the day
        reason="Bloqué en urgence par le médecin",
    )
    db.add(block)
    await db.commit()
    return {"status": "blocked", "date": today.isoformat(), "from": current_time.strftime("%H:%M")}


@router.post("/appointments/manual-book", response_model=appointment_schemas.AppointmentResponse)
async def manual_book_appointment(
    appointment_in: appointment_schemas.ManualAppointmentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Doctor manually booking a patient, bypassing anti-spam rules."""
    
    # Construct the full AppointmentCreate payload
    full_appointment = appointment_schemas.AppointmentCreate(
        doctor_id=current_doctor.id,
        appointment_date=appointment_in.appointment_date,
        appointment_time=appointment_in.appointment_time,
        patient_name=appointment_in.patient_name,
        patient_phone=appointment_in.patient_phone,
        patient_email=appointment_in.patient_email,
        reason=appointment_in.reason,
    )
    
    appointment = await appointment_service.create_appointment(
        db, 
        full_appointment, 
        background_tasks
    )
    return appointment


@router.post("/queue-close-today")
async def close_queue_today(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Instantly close queue bookings for today by creating a full-day blocked slot."""
    local_tz = timezone(timedelta(hours=1))
    today = date.today()

    # Check if already blocked today
    from sqlalchemy import and_
    existing = await db.execute(
        select(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == current_doctor.id,
                BlockedSlot.blocked_date == today,
                BlockedSlot.start_time.is_(None),
                BlockedSlot.end_time.is_(None),
            )
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_closed", "date": today.isoformat()}

    block = BlockedSlot(
        id=__import__('uuid').uuid4(),
        doctor_id=current_doctor.id,
        blocked_date=today,
        start_time=None,
        end_time=None,
        reason="File fermée par le médecin",
    )
    db.add(block)
    await db.commit()
    return {"status": "closed", "date": today.isoformat()}


@router.delete("/queue-close-today")
async def reopen_queue_today(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_clinic_user),
):
    """Re-open queue bookings for today by removing the full-day blocked slot."""
    from sqlalchemy import and_, delete
    today = date.today()
    await db.execute(
        delete(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == current_doctor.id,
                BlockedSlot.blocked_date == today,
                BlockedSlot.start_time.is_(None),
                BlockedSlot.end_time.is_(None),
            )
        )
    )
    await db.commit()
    return {"status": "reopened", "date": today.isoformat()}
