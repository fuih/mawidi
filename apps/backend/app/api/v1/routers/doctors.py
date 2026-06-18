from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.doctor import Doctor
from app.schemas import doctor as doctor_schemas
from app.schemas import common as common_schemas
from app.services import slot_service

router = APIRouter()

@router.get("/{identifier}/profile", response_model=doctor_schemas.DoctorPublicProfile)
async def get_doctor_profile(
    identifier: str,
    db: AsyncSession = Depends(get_db)
):
    """Get public profile of a doctor by UUID or slug."""
    try:
        doctor_uuid = UUID(identifier)
        query = select(Doctor).where(Doctor.id == doctor_uuid, Doctor.is_active == True)
    except ValueError:
        query = select(Doctor).where(Doctor.slug == identifier, Doctor.is_active == True)
        
    result = await db.execute(query)
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    return doctor


@router.get("/{identifier}/available-slots", response_model=common_schemas.AvailableSlotsResponse)
async def get_available_slots(
    identifier: str,
    target_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db)
):
    """Get available appointment slots for a doctor on a specific date."""
    # Ensure doctor exists
    try:
        doctor_uuid = UUID(identifier)
        query = select(Doctor).where(Doctor.id == doctor_uuid, Doctor.is_active == True)
    except ValueError:
        query = select(Doctor).where(Doctor.slug == identifier, Doctor.is_active == True)
        
    result = await db.execute(query)
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    slots = await slot_service.get_available_slots(db, doctor.id, target_date)
    
    return slots


@router.get("/{identifier}/booking-mode-for-date")
async def get_booking_mode_for_date(
    identifier: str,
    target_date: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the effective booking mode for a doctor on a specific date.

    Graceful transition rule:
    - If the date already has existing appointments in a given mode, that mode
      is preserved for new bookings (so patients who already booked time-slots
      keep their mode even after the doctor switches globally).
    - If the date has no appointments yet, the doctor's current booking_mode is used.
    """
    from sqlalchemy import and_
    from app.models.appointment import Appointment

    # Fetch doctor
    try:
        doctor_uuid = UUID(identifier)
        query = select(Doctor).where(Doctor.id == doctor_uuid, Doctor.is_active == True)
    except ValueError:
        query = select(Doctor).where(Doctor.slug == identifier, Doctor.is_active == True)
        
    dr_result = await db.execute(query)
    doctor = dr_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check existing appointments on this date
    existing_result = await db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == target_date,
            )
        )
        .limit(1)
    )
    first = existing_result.scalar_one_or_none()

    if first is not None:
        effective_mode = "queue_based" if first.queue_number is not None else "time_based"
    else:
        effective_mode = doctor.booking_mode

    return {"effective_mode": effective_mode}
