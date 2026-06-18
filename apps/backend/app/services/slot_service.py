"""
Slot availability service – THE CORE ALGORITHM.

Generates available time slots for a doctor on a given date by:
  1. Looking up the doctor's working hours for that day of week.
  2. Generating all possible slots from start_time to end_time.
  3. Removing slots that conflict with existing appointments.
  4. Removing slots that fall within blocked periods.
  5. If the date is today, removing past slots.
"""

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_slot import BlockedSlot
from app.models.working_hours import WorkingHours
from app.schemas.common import AvailableSlot, AvailableSlotsResponse


def _time_to_minutes(t: time) -> int:
    """Convert a time object to total minutes since midnight."""
    return t.hour * 60 + t.minute


def _minutes_to_time(minutes: int) -> time:
    """Convert total minutes since midnight to a time object."""
    return time(hour=minutes // 60, minute=minutes % 60)


from uuid import UUID

async def get_available_slots(
    db: AsyncSession,
    doctor_id: UUID | str,
    target_date: date,
) -> AvailableSlotsResponse:
    """Return all time slots for a doctor on a given date with availability info.

    Algorithm:
        1. Determine the ISO day_of_week (Monday=0).
        2. Fetch the doctor's WorkingHours for that day.
        3. Generate every slot from start → end using slot_duration_minutes.
        4. Fetch booked (non-cancelled) appointments for that date.
        5. Fetch blocked slots for that date.
        6. Mark each generated slot as available or unavailable.
        7. If target_date is today, mark past slots as unavailable.
    """
    # Step 1 – day of week (Monday=0)
    day_of_week = target_date.weekday()

    # Step 2 – fetch working hours
    result = await db.execute(
        select(WorkingHours).where(
            and_(
                WorkingHours.doctor_id == doctor_id,
                WorkingHours.day_of_week == day_of_week,
                WorkingHours.is_active.is_(True),
            )
        )
    )
    working_hours = result.scalar_one_or_none()

    if working_hours is None:
        # Doctor doesn't work on this day
        return AvailableSlotsResponse(
            date=target_date.isoformat(),
            doctor_id=str(doctor_id),
            slots=[],
        )

    # Step 3 – generate all possible slots
    start_minutes = _time_to_minutes(working_hours.start_time)
    end_minutes = _time_to_minutes(working_hours.end_time)
    duration = working_hours.slot_duration_minutes

    all_slot_times: list[time] = []
    current = start_minutes
    while current + duration <= end_minutes:
        all_slot_times.append(_minutes_to_time(current))
        current += duration

    if not all_slot_times:
        return AvailableSlotsResponse(
            date=target_date.isoformat(),
            doctor_id=str(doctor_id),
            slots=[],
        )

    # Step 4 – fetch booked appointments (non-cancelled)
    appt_result = await db.execute(
        select(Appointment.appointment_time).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == target_date,
                Appointment.status.notin_([
                    AppointmentStatus.cancelled,
                ]),
            )
        )
    )
    booked_times: set[time] = {row[0] for row in appt_result.all()}

    # Step 5 – fetch blocked slots for that date
    block_result = await db.execute(
        select(BlockedSlot).where(
            and_(
                BlockedSlot.doctor_id == doctor_id,
                BlockedSlot.blocked_date == target_date,
            )
        )
    )
    blocked_slots = block_result.scalars().all()

    # Pre-compute blocked time ranges for efficient lookup
    full_day_blocked = any(
        b.start_time is None and b.end_time is None for b in blocked_slots
    )

    blocked_ranges: list[tuple[int, int]] = []
    for b in blocked_slots:
        if b.start_time is not None and b.end_time is not None:
            blocked_ranges.append((
                _time_to_minutes(b.start_time),
                _time_to_minutes(b.end_time),
            ))

    # Step 6 & 7 – determine availability
    # Use local Algeria time (UTC+1) so slot filtering is correct for the local timezone.
    local_tz = timezone(timedelta(hours=1))
    now_local = datetime.now(local_tz)
    is_today = target_date == now_local.date()
    # Add a 5-minute buffer so the very next slot is still bookable
    current_minutes = _time_to_minutes(now_local.time()) + 5 if is_today else -1

    slots: list[AvailableSlot] = []
    for slot_time in all_slot_times:
        slot_minutes = _time_to_minutes(slot_time)

        # Check if available
        is_available = True

        # Past slot (today only) — slot must start strictly after now + buffer
        if is_today and slot_minutes < current_minutes:
            is_available = False

        # Already booked
        elif slot_time in booked_times:
            is_available = False

        # Full day blocked
        elif full_day_blocked:
            is_available = False

        # Partially blocked
        elif any(
            start <= slot_minutes < end for start, end in blocked_ranges
        ):
            is_available = False

        slots.append(AvailableSlot(time=slot_time, is_available=is_available))

    return AvailableSlotsResponse(
        date=target_date.isoformat(),
        doctor_id=str(doctor_id),
        slots=slots,
    )
