"""
Appointment service – booking, listing, status updates, and statistics.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import Doctor
from app.models.working_hours import WorkingHours
from app.models.blocked_slot import BlockedSlot
from app.models.notification import Notification
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentListResponse,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentReschedule
)
from fastapi import BackgroundTasks
from app.services.sms_service import send_appointment_notification_sms

def _appointment_to_response(appt: Appointment) -> AppointmentResponse:
    """Map an Appointment ORM instance to its Pydantic response schema."""
    return AppointmentResponse(
        id=appt.id,
        doctor_id=appt.doctor_id,
        patient_id=appt.patient_id,
        patient_name=appt.patient_name,
        patient_phone=appt.patient_phone,
        patient_email=appt.patient_email,
        appointment_date=appt.appointment_date,
        appointment_time=appt.appointment_time,
        duration_minutes=appt.duration_minutes,
        queue_number=appt.queue_number,
        reason=appt.reason,
        status=appt.status,
        cancellation_reason=appt.cancellation_reason,
        notes=appt.notes,
        reminder_sent=appt.reminder_sent,
        created_at=appt.created_at,
        updated_at=appt.updated_at,
        doctor_first_name=appt.doctor.first_name if appt.doctor else None,
        doctor_last_name=appt.doctor.last_name if appt.doctor else None,
        doctor_specialty=appt.doctor.specialty if appt.doctor else None,
        doctor_city=appt.doctor.city if appt.doctor else None,
    )


async def create_appointment(
    db: AsyncSession,
    data: AppointmentCreate,
    background_tasks: BackgroundTasks,
    skip_anti_spam: bool = False,
) -> AppointmentResponse:
    """Book a new appointment.

    Supports two modes based on the doctor's booking_mode:
    - time_based: Validates time slot, prevents double-booking.
    - queue_based: Assigns a queue number for the day (race-condition-safe via FOR UPDATE).
    """
    # Ensure doctor exists and acquire a row-level lock to serialize all bookings
    # for this doctor. This prevents queue number race conditions and deadlocks.
    result = await db.execute(
        select(Doctor).where(Doctor.id == data.doctor_id).with_for_update()
    )
    doctor = result.scalar_one_or_none()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is currently not accepting appointments",
        )

    # Validate the day has working hours (applies to both modes)
    day_of_week = data.appointment_date.weekday()
    wh_result = await db.execute(
        select(WorkingHours).where(
            and_(
                WorkingHours.doctor_id == data.doctor_id,
                WorkingHours.day_of_week == day_of_week,
                WorkingHours.is_active.is_(True),
            )
        )
    )
    working_hours = wh_result.scalar_one_or_none()
    if working_hours is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor does not work on the selected day",
        )

    # Check for full-day blocks (applies to both modes)
    full_day_block = await db.execute(
        select(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == data.doctor_id,
                BlockedSlot.blocked_date == data.appointment_date,
                BlockedSlot.start_time.is_(None),
                BlockedSlot.end_time.is_(None),
            )
        )
    )
    if full_day_block.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not available on this day (full day blocked).",
        )

    # Prevent booking in the past — use local time (UTC+1 for Algeria)
    local_tz = timezone(timedelta(hours=1))
    now_local = datetime.now(local_tz)
    if data.appointment_date < now_local.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book an appointment in the past",
        )

    if not skip_anti_spam:
        # ── ANTI-SPAM: one active appointment per phone number per doctor ──
        all_active = await db.execute(
            select(Appointment).where(
                and_(
                    Appointment.doctor_id == data.doctor_id,
                    Appointment.patient_phone == data.patient_phone,
                    Appointment.appointment_date >= now_local.date(),
                    Appointment.status.in_([
                        AppointmentStatus.pending,
                        AppointmentStatus.confirmed,
                    ]),
                )
            )
        )
        existing = all_active.scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Un rendez-vous actif existe déjà avec ce numéro de téléphone "
                    f"({existing.patient_name}). Veuillez annuler ou attendre la fin "
                    "du rendez-vous existant avant d'en réserver un nouveau."
                ),
            )

    # ── DETERMINE EFFECTIVE MODE FOR THIS DATE ────────────────
    # If this date already has appointments from a PREVIOUS mode,
    # preserve that mode so the transition is graceful.
    # Only fresh dates (zero appointments) use the doctor's current booking_mode.
    existing_for_date = await db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.doctor_id == data.doctor_id,
                Appointment.appointment_date == data.appointment_date,
            )
        )
        .limit(1)
    )
    first_existing = existing_for_date.scalar_one_or_none()

    if first_existing is not None:
        # Inherit the mode of the existing appointments on this day
        effective_mode = "queue_based" if first_existing.queue_number is not None else "time_based"
    else:
        # Fresh date — use the doctor's current mode
        effective_mode = doctor.booking_mode

    # ── QUEUE-BASED MODE ─────────────────────────────────────
    if effective_mode == "queue_based":


        count_result = await db.execute(
            select(func.count(Appointment.id)).where(
                and_(
                    Appointment.doctor_id == data.doctor_id,
                    Appointment.appointment_date == data.appointment_date,
                )
            )
        )
        total_for_day = count_result.scalar() or 0
        next_queue_number = total_for_day + 1

        # Enforce daily cap if set
        if doctor.max_daily_queue is not None and next_queue_number > doctor.max_daily_queue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le nombre maximum de patients pour ce jour ({doctor.max_daily_queue}) est atteint.",
            )

        # Enforce cutoff time for same-day bookings
        if doctor.queue_cutoff_time is not None and data.appointment_date == now_local.date():
            if now_local.time() >= doctor.queue_cutoff_time:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Les réservations pour aujourd'hui sont fermées après {doctor.queue_cutoff_time.strftime('%H:%M')}.",
                )

        appointment = Appointment(
            id=uuid.uuid4(),
            doctor_id=data.doctor_id,
            patient_id=data.patient_id,
            patient_name=data.patient_name,
            patient_phone=data.patient_phone,
            patient_email=data.patient_email,
            appointment_date=data.appointment_date,
            appointment_time=None,
            duration_minutes=0,
            queue_number=next_queue_number,
            reason=data.reason,
            status=AppointmentStatus.confirmed if doctor.auto_confirm_appointments else AppointmentStatus.pending,
        )

        try:
            db.add(appointment)
            await db.commit()
            await db.refresh(appointment)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Erreur lors de l'attribution du numéro de file. Veuillez réessayer.",
            )

        # Notification
        notification_msg = f"Nouveau RDV file d'attente: {data.patient_name} — #{next_queue_number} le {data.appointment_date.strftime('%d/%m/%Y')}."
        db.add(Notification(id=uuid.uuid4(), doctor_id=data.doctor_id, message=notification_msg))
        await db.commit()

        await db.refresh(appointment, attribute_names=["doctor"])

        # SMS to patient with queue number
        background_tasks.add_task(
            send_appointment_notification_sms,
            appointment.patient_phone,
            appointment.patient_name,
            appointment.appointment_date.strftime('%d/%m/%Y'),
            None,
            "pending",
            next_queue_number,
            appointment.cancellation_token,
        )
        return _appointment_to_response(appointment)

    # ── TIME-BASED MODE ──────────────────────────────────────
    if data.appointment_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'heure du rendez-vous est requise pour ce médecin.",
        )

    # Check that the requested time is within working hours
    if data.appointment_time < working_hours.start_time or data.appointment_time >= working_hours.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested time is outside working hours",
        )

    # Fetch blocked slots for this date to check for partial time blocks
    blocked_slots_result = await db.execute(
        select(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == data.doctor_id,
                BlockedSlot.blocked_date == data.appointment_date,
            )
        )
    )
    blocked_slots = blocked_slots_result.scalars().all()

    # Check for partial time blocks
    for blocked in blocked_slots:
        if (
            blocked.start_time is not None
            and blocked.end_time is not None
            and blocked.start_time <= data.appointment_time < blocked.end_time
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected time slot is blocked",
            )

    if data.appointment_date == now_local.date() and data.appointment_time <= now_local.time():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a past time slot",
        )

    appointment = Appointment(
        id=uuid.uuid4(),
        doctor_id=data.doctor_id,
        patient_id=data.patient_id,
        patient_name=data.patient_name,
        patient_phone=data.patient_phone,
        patient_email=data.patient_email,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        duration_minutes=working_hours.slot_duration_minutes,
        reason=data.reason,
        status=AppointmentStatus.confirmed if doctor.auto_confirm_appointments else AppointmentStatus.pending,
    )

    try:
        db.add(appointment)
        await db.commit()
        await db.refresh(appointment)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked",
        )

    # Generate Notification
    notification_msg = f"Nouveau rendez-vous: {data.patient_name} le {data.appointment_date.strftime('%d/%m/%Y')} à {data.appointment_time.strftime('%H:%M')}."
    notification = Notification(
        id=uuid.uuid4(),
        doctor_id=data.doctor_id,
        message=notification_msg
    )
    db.add(notification)
    await db.commit()

    # Eagerly load doctor relationship for the response
    await db.refresh(appointment, attribute_names=["doctor"])

    # Send SMS Notification to Patient
    background_tasks.add_task(
        send_appointment_notification_sms,
        appointment.patient_phone,
        appointment.patient_name,
        appointment.appointment_date.strftime('%d/%m/%Y'),
        appointment.appointment_time.strftime('%H:%M'),
        "pending",
        None,
        appointment.cancellation_token,
    )

    return _appointment_to_response(appointment)


async def get_doctor_appointments(
    db: AsyncSession,
    doctor_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
    status_filter: AppointmentStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> AppointmentListResponse:
    """Fetch a paginated, filtered list of appointments for a doctor's dashboard."""

    conditions = [Appointment.doctor_id == doctor_id]

    if status_filter is not None:
        conditions.append(Appointment.status == status_filter)
    if date_from is not None:
        conditions.append(Appointment.appointment_date >= date_from)
    if date_to is not None:
        conditions.append(Appointment.appointment_date <= date_to)

    # Total count
    count_query = select(func.count()).select_from(Appointment).where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginated results
    offset = (page - 1) * per_page
    data_query = (
        select(Appointment)
        .where(and_(*conditions))
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(data_query)
    appointments = result.scalars().all()

    return AppointmentListResponse(
        items=[_appointment_to_response(a) for a in appointments],
        total=total,
        page=page,
        per_page=per_page,
    )


async def get_today_appointments(
    db: AsyncSession,
    doctor_id: uuid.UUID,
) -> list[AppointmentResponse]:
    """Fetch all of today's appointments for a doctor, ordered by time."""
    today = datetime.now(timezone.utc).date()

    result = await db.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == today,
            )
        )
        .order_by(Appointment.appointment_time.asc())
    )
    appointments = result.scalars().all()
    
    responses = []
    unique_phones = list(set([appt.patient_phone for appt in appointments if appt.patient_phone]))
    
    patient_stats = {}
    
    if unique_phones:
        # Group by phone and status to get counts for all patients at once
        stats_query = select(
            Appointment.patient_phone,
            Appointment.status,
            func.count(Appointment.id)
        ).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.patient_phone.in_(unique_phones),
                # Remove appointment_date < today so we include appointments from earlier today
                Appointment.id.notin_([a.id for a in appointments]) # Exclude the current appointments we are fetching to avoid skewing stats if they were already marked
            )
        ).group_by(Appointment.patient_phone, Appointment.status)
        
        stats_result = await db.execute(stats_query)
        
        # Initialize stats dict
        for phone in unique_phones:
            patient_stats[phone] = {"total_terminal": 0, "no_shows": 0, "completed": 0, "rate": 0.0}
            
        for row in stats_result.all():
            phone, status, count = row
            if status == AppointmentStatus.no_show:
                patient_stats[phone]["no_shows"] += count
                patient_stats[phone]["total_terminal"] += count
            elif status == AppointmentStatus.completed:
                patient_stats[phone]["completed"] += count
                patient_stats[phone]["total_terminal"] += count
                
        # Calculate rate
        for phone in unique_phones:
            total_term = patient_stats[phone]["total_terminal"]
            if total_term > 0:
                patient_stats[phone]["rate"] = round(patient_stats[phone]["no_shows"] / total_term, 2)
    
    for appt in appointments:
        resp = _appointment_to_response(appt)
        phone = appt.patient_phone
        # It's a new patient if they have 0 past completed appointments
        resp.is_new_patient = patient_stats.get(phone, {}).get("completed", 0) == 0 if phone else True
        responses.append(resp)
        
    return {
        "appointments": responses,
        "patient_stats": patient_stats
    }


async def update_appointment_status(
    db: AsyncSession,
    appointment_id: uuid.UUID,
    doctor_id: uuid.UUID,
    data: AppointmentStatusUpdate,
    background_tasks: BackgroundTasks,
) -> AppointmentResponse:
    """Update the status of an appointment.

    Validates:
        - Appointment exists and belongs to the doctor.
        - Status transition is valid.
    """
    result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.id == appointment_id,
                Appointment.doctor_id == doctor_id,
            )
        )
    )
    appointment = result.scalar_one_or_none()

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Validate status transitions
    valid_transitions: dict[AppointmentStatus, set[AppointmentStatus]] = {
        AppointmentStatus.pending: {
            AppointmentStatus.confirmed,
            AppointmentStatus.cancelled,
            AppointmentStatus.completed,
            AppointmentStatus.no_show,
        },
        AppointmentStatus.confirmed: {
            AppointmentStatus.completed,
            AppointmentStatus.cancelled,
            AppointmentStatus.no_show,
        },
        AppointmentStatus.completed: set(),  # terminal state
        AppointmentStatus.cancelled: {
            AppointmentStatus.pending,  # allow undo of accidental cancellation
        },
        AppointmentStatus.no_show: {
            AppointmentStatus.confirmed,  # allow undo of accidental no-show mark
        },
    }

    if data.status not in valid_transitions.get(appointment.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{appointment.status.value}' to '{data.status.value}'",
        )

    appointment.status = data.status
    if data.cancellation_reason and data.status == AppointmentStatus.cancelled:
        appointment.cancellation_reason = data.cancellation_reason

    # Generate Notification
    patient_name = appointment.patient_name
    date_str = appointment.appointment_date.strftime('%d/%m/%Y')
    # Queue-based appointments have no time — use queue number instead
    if appointment.appointment_time is not None:
        slot_label = f"à {appointment.appointment_time.strftime('%H:%M')}"
    elif appointment.queue_number is not None:
        slot_label = f"(file #{appointment.queue_number})"
    else:
        slot_label = ""

    status_msg = ""
    if data.status == AppointmentStatus.confirmed:
        status_msg = "a été confirmé"
    elif data.status == AppointmentStatus.cancelled:
        status_msg = "a été annulé"
    elif data.status == AppointmentStatus.completed:
        status_msg = "est terminé"
    elif data.status == AppointmentStatus.no_show:
        status_msg = "a été marqué comme absent"
        
    if status_msg:
        notification_msg = f"Le rendez-vous avec {patient_name} ({date_str} {slot_label}) {status_msg}."
        notification = Notification(
            id=uuid.uuid4(),
            doctor_id=doctor_id,
            message=notification_msg
        )
        db.add(notification)

    await db.commit()
    await db.refresh(appointment)

    # Send SMS Notification to Patient if confirmed
    if data.status == AppointmentStatus.confirmed:
        background_tasks.add_task(
            send_appointment_notification_sms,
            appointment.patient_phone,
            appointment.patient_name,
            appointment.appointment_date.strftime('%d/%m/%Y'),
            appointment.appointment_time.strftime('%H:%M') if appointment.appointment_time else None,
            "confirmed",
            appointment.queue_number,
            str(appointment.id),
        )

    return _appointment_to_response(appointment)


async def reschedule_appointment(
    db: AsyncSession,
    appointment_id: uuid.UUID,
    doctor_id: uuid.UUID,
    data: appointment_schemas.AppointmentReschedule,
    background_tasks: BackgroundTasks,
) -> appointment_schemas.AppointmentResponse:
    """Move an appointment to a new date/time and update queue number if needed."""
    
    # Ensure appointment exists
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()

    if not appointment or appointment.doctor_id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rendez-vous introuvable."
        )

    # Acquire lock on the doctor row to serialize reschedule operations
    doc_result = await db.execute(
        select(Doctor).where(Doctor.id == doctor_id).with_for_update()
    )
    doctor = doc_result.scalar_one_or_none()

    # Prevent moving to past
    local_tz = timezone(timedelta(hours=1))
    now_local = datetime.now(local_tz)
    if data.appointment_date < now_local.date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de déplacer un rendez-vous dans le passé."
        )

    # 3. Determine Mode and Apply Changes
    # If this date already has appointments, preserve that mode. Otherwise use doctor's current mode.
    existing_for_date = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == data.appointment_date,
            )
        ).limit(1)
    )
    first_existing = existing_for_date.scalar_one_or_none()
    if first_existing is not None:
        effective_mode = "queue_based" if first_existing.queue_number is not None else "time_based"
    else:
        effective_mode = doctor.booking_mode

    if effective_mode == "queue_based":

        # Calculate new queue number for target date
        count_result = await db.execute(
            select(func.count(Appointment.id)).where(
                and_(
                    Appointment.doctor_id == doctor_id,
                    Appointment.appointment_date == data.appointment_date,
                )
            )
        )
        total_for_day = count_result.scalar() or 0
        next_queue_number = total_for_day + 1

        if doctor.max_daily_queue is not None and next_queue_number > doctor.max_daily_queue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le nombre maximum de patients pour le {data.appointment_date.strftime('%d/%m/%Y')} est déjà atteint."
            )

        appointment.queue_number = next_queue_number
        appointment.appointment_time = None
    else:
        # Time-based
        if data.appointment_time is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Une heure de rendez-vous est requise pour ce jour."
            )
        appointment.appointment_time = data.appointment_time
        appointment.queue_number = None

    # Update common fields
    appointment.appointment_date = data.appointment_date
    appointment.status = AppointmentStatus.confirmed if doctor.auto_confirm_appointments else AppointmentStatus.pending
    
    # Generate Notification
    notification_msg = f"Rendez-vous déplacé: {appointment.patient_name} a été déplacé au {data.appointment_date.strftime('%d/%m/%Y')}."
    db.add(Notification(id=uuid.uuid4(), doctor_id=doctor_id, message=notification_msg))

    await db.commit()
    await db.refresh(appointment)

    # Send SMS
    background_tasks.add_task(
        send_appointment_notification_sms,
        appointment.patient_phone,
        appointment.patient_name,
        appointment.appointment_date.strftime('%d/%m/%Y'),
        appointment.appointment_time.strftime('%H:%M') if appointment.appointment_time else None,
        "pending", # Using pending template because it contains queue info or resends time
        appointment.queue_number,
        str(appointment.id),
    )

    return _appointment_to_response(appointment)


async def get_analytics_stats(
    db: AsyncSession,
    doctor_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    """Return aggregate appointment counts for the doctor's dashboard.

    Returns:
        Dict with counts per status + today_count + total_count + weekly chart data.
    """
    # Base query for counts within date range
    base_query = select(Appointment).where(Appointment.doctor_id == doctor_id)
    if start_date:
        base_query = base_query.where(Appointment.appointment_date >= start_date)
    if end_date:
        base_query = base_query.where(Appointment.appointment_date <= end_date)

    # Total count in range
    total_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = total_result.scalar() or 0

    # Per-status counts in range
    status_result = await db.execute(
        select(Appointment.status, func.count())
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.appointment_date >= start_date if start_date else True)
        .where(Appointment.appointment_date <= end_date if end_date else True)
        .group_by(Appointment.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}

    # Today count
    today = datetime.now(timezone.utc).date()
    today_result = await db.execute(
        select(func.count()).select_from(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == today,
            )
        )
    )
    today_count = today_result.scalar() or 0

    no_show_count = status_counts.get("no_show", 0)
    completed_count = status_counts.get("completed", 0)
    total_terminal = no_show_count + completed_count
    no_show_rate = round((no_show_count / total_terminal) * 100) if total_terminal > 0 else 0

    doctor_result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = doctor_result.scalar_one_or_none()
    
    fill_rate = 0
    avg_patients_per_day = 0

    if doctor:
        if doctor.booking_mode == "queue_based":
            # calculate average patients per day (for days with > 0 appointments)
            days_query = select(func.count(func.distinct(Appointment.appointment_date))).where(
                Appointment.doctor_id == doctor_id
            )
            if start_date:
                days_query = days_query.where(Appointment.appointment_date >= start_date)
            if end_date:
                days_query = days_query.where(Appointment.appointment_date <= end_date)
                
            active_days = (await db.execute(days_query)).scalar() or 0
            if active_days > 0:
                avg_patients_per_day = round(total / active_days, 1)
        else:
            # Time based: placeholder for fill rate calculation
            # For now, just return a dummy fill_rate based on appointments / (slots * days)
            pass
            
    # Weekly Chart (daily breakdown within range)
    # Default to last 7 days if no range provided
    chart_start = start_date or (today - timedelta(days=6))
    chart_end = end_date or today
    
    chart_query = select(
        Appointment.appointment_date,
        Appointment.status,
        func.count(Appointment.id)
    ).where(
        and_(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date >= chart_start,
            Appointment.appointment_date <= chart_end
        )
    ).group_by(Appointment.appointment_date, Appointment.status)
    
    chart_result = await db.execute(chart_query)
    
    # Organize chart data by date
    chart_data = {}
    current_d = chart_start
    while current_d <= chart_end:
        date_str = current_d.isoformat()
        chart_data[date_str] = {
            "date": date_str,
            "booked": 0,
            "completed": 0,
            "cancelled": 0,
            "no_show": 0
        }
        current_d += timedelta(days=1)
        
    for row in chart_result.all():
        date_val, status, count = row
        date_str = date_val.isoformat()
        if date_str in chart_data:
            chart_data[date_str]["booked"] += count
            if status == AppointmentStatus.completed:
                chart_data[date_str]["completed"] += count
            elif status == AppointmentStatus.cancelled:
                chart_data[date_str]["cancelled"] += count
            elif status == AppointmentStatus.no_show:
                chart_data[date_str]["no_show"] += count

    return {
        "total": total,
        "today": today_count,
        "pending": status_counts.get("pending", 0),
        "confirmed": status_counts.get("confirmed", 0),
        "completed": completed_count,
        "cancelled": status_counts.get("cancelled", 0),
        "no_show": no_show_count,
        "no_show_rate": no_show_rate,
        "fill_rate": fill_rate if doctor and doctor.booking_mode == "time_based" else None,
        "avg_patients_per_day": avg_patients_per_day if doctor and doctor.booking_mode == "queue_based" else None,
        "weekly_chart": list(chart_data.values())
    }

async def get_patient_appointments(
    db: AsyncSession,
    patient_id: uuid.UUID,
) -> list[AppointmentResponse]:
    """Fetch all appointments for a given patient.

    Matches both:
    - Appointments booked while logged in (patient_id == patient_id)
    - Appointments booked as a guest with the same phone number (patient_id IS NULL)

    Guest appointments are auto-linked to the patient account on first fetch.
    """
    import logging
    logger = logging.getLogger(__name__)
    from app.models.patient import Patient
    from sqlalchemy import or_
    from sqlalchemy.orm import selectinload

    # Resolve patient phone for guest-booking lookup
    patient_res = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_res.scalar_one_or_none()
    patient_phone = patient.phone if patient else None

    logger.info(f"[patient_appointments] patient_id={patient_id}, phone={patient_phone}")

    # Build where clause: by patient_id OR (guest + same phone)
    conditions = [Appointment.patient_id == patient_id]
    if patient_phone:
        conditions.append(
            and_(
                Appointment.patient_id.is_(None),
                Appointment.patient_phone == patient_phone,
            )
        )

    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(or_(*conditions))
        .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
    )
    appointments = result.scalars().all()

    logger.info(f"[patient_appointments] found {len(appointments)} appointments")
    for a in appointments:
        logger.info(f"  -> {a.appointment_date} phone={a.patient_phone} patient_id={a.patient_id}")

    # Auto-link guest appointments to this patient account
    linked = False
    for appt in appointments:
        if appt.patient_id is None:
            appt.patient_id = patient_id
            linked = True
    if linked:
        await db.commit()

    return [_appointment_to_response(a) for a in appointments]


async def patient_cancel_appointment(
    db: AsyncSession,
    appointment_id: uuid.UUID,
    patient_id: uuid.UUID,
    reason: str | None = None
) -> AppointmentResponse:
    """Allow a patient to cancel their own appointment."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(
            and_(Appointment.id == appointment_id, Appointment.patient_id == patient_id)
        )
    )
    appointment = result.scalar_one_or_none()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.status in [AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show]:
        raise HTTPException(status_code=400, detail="Cannot cancel an appointment that is already completed, cancelled, or marked as no-show.")

    # Prevent cancelling past appointments (use local time UTC+1)
    local_tz = timezone(timedelta(hours=1))
    now = datetime.now(local_tz)
    is_past = appointment.appointment_date < now.date()
    # For time-based: also check if the time slot has already passed today
    if not is_past and appointment.appointment_time is not None:
        is_past = (appointment.appointment_date == now.date() and appointment.appointment_time <= now.time())
    if is_past:
        raise HTTPException(status_code=400, detail="Cannot cancel a past appointment.")

    appointment.status = AppointmentStatus.cancelled
    if reason:
        appointment.cancellation_reason = reason

    # Generate Notification for Doctor
    date_str = appointment.appointment_date.strftime('%d/%m/%Y')
    if appointment.appointment_time is not None:
        slot_label = f"à {appointment.appointment_time.strftime('%H:%M')}"
    elif appointment.queue_number is not None:
        slot_label = f"(file #{appointment.queue_number})"
    else:
        slot_label = ""
    notification_msg = f"Le patient {appointment.patient_name} a annulé son rendez-vous du {date_str} {slot_label}."
    notification = Notification(
        id=uuid.uuid4(),
        doctor_id=appointment.doctor_id,
        message=notification_msg
    )
    db.add(notification)

    await db.commit()

    # Re-fetch with doctor eagerly loaded (refresh loses selectinload)
    refetch = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(Appointment.id == appointment_id)
    )
    appointment = refetch.scalar_one()
    return _appointment_to_response(appointment)

async def patient_reschedule_appointment(
    db: AsyncSession,
    appointment_id: uuid.UUID,
    patient_id: uuid.UUID,
    data: AppointmentReschedule
) -> AppointmentResponse:
    """Allow a patient to reschedule their own appointment."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(
            and_(Appointment.id == appointment_id, Appointment.patient_id == patient_id)
        )
    )
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if appointment.status in [AppointmentStatus.completed, AppointmentStatus.cancelled, AppointmentStatus.no_show]:
        raise HTTPException(status_code=400, detail="Cannot reschedule an appointment that is completed, cancelled, or no-show.")
        
    # Prevent rescheduling past appointments (use local time UTC+1)
    local_tz = timezone(timedelta(hours=1))
    now = datetime.now(local_tz)
    is_past = appointment.appointment_date < now.date()
    if not is_past and appointment.appointment_time is not None:
        is_past = (appointment.appointment_date == now.date() and appointment.appointment_time <= now.time())
    if is_past:
        raise HTTPException(status_code=400, detail="Cannot reschedule a past appointment.")

    # Queue-based appointments cannot be rescheduled to a specific time slot
    if appointment.queue_number is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Les rendez-vous en file d'attente ne peuvent pas être reprogrammés. Veuillez annuler et réserver un nouveau jour.",
        )

    # Validate the new slot
    if data.appointment_date < now.date() or (data.appointment_date == now.date() and data.appointment_time <= now.time()):
        raise HTTPException(status_code=400, detail="Cannot reschedule to a past date/time.")

    # Validate working hours for the new day
    day_of_week = data.appointment_date.weekday()
    wh_result = await db.execute(
        select(WorkingHours).where(
            and_(
                WorkingHours.doctor_id == appointment.doctor_id,
                WorkingHours.day_of_week == day_of_week,
                WorkingHours.is_active.is_(True),
            )
        )
    )
    working_hours = wh_result.scalar_one_or_none()
    if not working_hours:
        raise HTTPException(status_code=400, detail="Doctor does not work on the selected day")

    if data.appointment_time < working_hours.start_time or data.appointment_time >= working_hours.end_time:
        raise HTTPException(status_code=400, detail="Requested time is outside working hours")

    # Check for blocked slots
    block_result = await db.execute(
        select(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == appointment.doctor_id,
                BlockedSlot.blocked_date == data.appointment_date,
            )
        )
    )
    blocked_slots = block_result.scalars().all()
    for blocked in blocked_slots:
        if blocked.start_time is None and blocked.end_time is None:
            raise HTTPException(status_code=400, detail="Doctor is unavailable on the selected date")
        if (blocked.start_time is not None and blocked.end_time is not None and 
            blocked.start_time <= data.appointment_time < blocked.end_time):
            raise HTTPException(status_code=400, detail="The selected time slot is blocked")

    # Update the appointment
    old_date = appointment.appointment_date
    old_time = appointment.appointment_time
    appointment.appointment_date = data.appointment_date
    appointment.appointment_time = data.appointment_time
    appointment.status = AppointmentStatus.pending  # Resets to pending for doctor approval

    # Generate Notification for Doctor
    old_time_str = old_time.strftime('%H:%M') if old_time else "?"
    new_time_str = data.appointment_time.strftime('%H:%M') if data.appointment_time else "?"
    notification_msg = (
        f"Le patient {appointment.patient_name} a reporté son rendez-vous "
        f"du {old_date.strftime('%d/%m/%Y')} à {old_time_str} "
        f"vers le {data.appointment_date.strftime('%d/%m/%Y')} à {new_time_str}."
    )
    notification = Notification(
        id=uuid.uuid4(),
        doctor_id=appointment.doctor_id,
        message=notification_msg
    )
    db.add(notification)
    
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    # Re-fetch with doctor eagerly loaded
    refetch = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(Appointment.id == appointment_id)
    )
    appointment = refetch.scalar_one()
    return _appointment_to_response(appointment)

async def get_monthly_appointment_counts(
    db: AsyncSession, doctor_id: uuid.UUID, year: int, month: int
) -> dict[str, int]:
    """Get the number of appointments for each day in a given month."""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)

    query = (
        select(
            Appointment.appointment_date,
            func.count(Appointment.id).label("count"),
        )
        .where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date >= start_date,
                Appointment.appointment_date <= end_date,
                Appointment.status != AppointmentStatus.cancelled,
            )
        )
        .group_by(Appointment.appointment_date)
    )

    result = await db.execute(query)
    
    counts = {}
    for row in result:
        counts[row.appointment_date.isoformat()] = row.count
        
    return counts

async def guest_get_appointment(
    db: AsyncSession,
    cancellation_token: str
) -> AppointmentResponse:
    """Retrieve appointment details for a guest using the cancellation token."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(Appointment.cancellation_token == cancellation_token)
    )
    appt = result.scalar_one_or_none()
    
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rendez-vous introuvable."
        )
        
    return _appointment_to_response(appt)


async def guest_cancel_appointment(
    db: AsyncSession,
    cancellation_token: str,
    phone: str,
    background_tasks: BackgroundTasks
) -> AppointmentResponse:
    """Cancel an appointment using the cancellation token (guest mode) and phone challenge."""
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(Appointment.cancellation_token == cancellation_token)
    )
    appt = result.scalar_one_or_none()

    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rendez-vous introuvable."
        )
        
    if appt.patient_phone != phone:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Le numéro de téléphone ne correspond pas à ce rendez-vous."
        )

    if appt.status in [
        AppointmentStatus.cancelled,
        AppointmentStatus.completed,
        AppointmentStatus.no_show,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce rendez-vous ne peut plus être annulé."
        )

    appt.status = AppointmentStatus.cancelled
    appt.cancellation_reason = "Annulé par le patient (lien public)"
    appt.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(appt, attribute_names=["doctor"])
    
    # Notify doctor
    if appt.doctor_id:
        from app.models.notification import Notification
        notif = Notification(
            id=uuid.uuid4(),
            doctor_id=appt.doctor_id,
            message=f"Annulation : {appt.patient_name} a annulé son rendez-vous du {appt.appointment_date}."
        )
        db.add(notif)
        await db.commit()

    return _appointment_to_response(appt)
