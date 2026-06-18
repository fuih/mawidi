from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.schemas import appointment as appointment_schemas
from app.services import appointment_service
from app.core.dependencies import get_optional_patient, get_current_patient
from app.models.patient import Patient
from typing import List
from uuid import UUID
from fastapi import Request
from app.core.limiter import limiter

router = APIRouter()

@router.post("/book", response_model=appointment_schemas.AppointmentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def book_appointment(
    request: Request,
    appointment_in: appointment_schemas.AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient | None = Depends(get_optional_patient)
):
    """Book a new appointment. Can be done by a guest or a logged-in patient."""
    
    # If patient is logged in, use their ID and details
    if current_patient:
        appointment_in.patient_id = current_patient.id
        # Override with patient's actual details if not provided or to ensure accuracy
        if not appointment_in.patient_name:
            appointment_in.patient_name = f"{current_patient.first_name} {current_patient.last_name}"
        if not appointment_in.patient_phone:
            appointment_in.patient_phone = current_patient.phone
            
    # Validate required fields
    if not appointment_in.patient_name or not appointment_in.patient_phone:
        raise HTTPException(
            status_code=400,
            detail="Patient name and phone are required for guest booking."
        )

    try:
        appointment = await appointment_service.create_appointment(db, appointment_in, background_tasks)
        return appointment
    except ValueError as e:
        # e.g., slot not available, past date
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        # DB level constraint violation (double booking)
        raise HTTPException(status_code=409, detail="This time slot has just been booked. Please choose another one.")

@router.get("/patient/me", response_model=List[appointment_schemas.AppointmentResponse])
async def get_my_appointments(
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient)
):
    """Get all appointments for the logged-in patient."""
    return await appointment_service.get_patient_appointments(db, current_patient.id)


@router.patch("/patient/{appointment_id}/cancel", response_model=appointment_schemas.AppointmentResponse)
async def cancel_my_appointment(
    appointment_id: UUID,
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient)
):
    """Cancel an appointment belonging to the logged-in patient."""
    return await appointment_service.patient_cancel_appointment(db, appointment_id, current_patient.id, reason)


@router.patch("/patient/{appointment_id}/reschedule", response_model=appointment_schemas.AppointmentResponse)
async def reschedule_my_appointment(
    appointment_id: UUID,
    data: appointment_schemas.AppointmentReschedule,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient)
):
    """Reschedule an appointment belonging to the logged-in patient."""
    return await appointment_service.patient_reschedule_appointment(db, appointment_id, current_patient.id, data)

@router.get("/guest/{cancellation_token}", response_model=appointment_schemas.AppointmentResponse)
async def get_guest_appointment(
    cancellation_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get appointment details by its cancellation token (for guest cancellation page)."""
    return await appointment_service.guest_get_appointment(db, cancellation_token)


@router.patch("/guest/{cancellation_token}/cancel", response_model=appointment_schemas.AppointmentResponse)
@limiter.limit("5/hour", key_func=lambda request: request.path_params.get("cancellation_token", request.client.host))
async def cancel_guest_appointment(
    request: Request,
    cancellation_token: str,
    data: appointment_schemas.GuestCancelRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Cancel an appointment using only its cancellation token (for guest patients)."""
    return await appointment_service.guest_cancel_appointment(db, cancellation_token, data.phone, background_tasks)
