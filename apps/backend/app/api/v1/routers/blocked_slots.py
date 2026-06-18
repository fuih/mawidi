import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.models.blocked_slot import BlockedSlot
from app.models.doctor import Doctor
from app.schemas.blocked_slot import BlockedSlotCreate, BlockedSlotResponse
from app.core.dependencies import get_current_clinic_user

router = APIRouter()

@router.get("", response_model=List[BlockedSlotResponse])
async def get_blocked_slots(
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all blocked slots for the logged-in doctor."""
    query = select(BlockedSlot).where(
        BlockedSlot.doctor_id == doctor.id
    ).order_by(BlockedSlot.blocked_date.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=BlockedSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_blocked_slot(
    data: BlockedSlotCreate,
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a new blocked slot (exception/time-off) for the doctor."""
    if data.start_time and data.end_time and data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    slot = BlockedSlot(
        id=uuid.uuid4(),
        doctor_id=doctor.id,
        blocked_date=data.blocked_date,
        start_time=data.start_time,
        end_time=data.end_time,
        reason=data.reason
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot

@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blocked_slot(
    slot_id: uuid.UUID,
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a blocked slot."""
    query = select(BlockedSlot).where(
        and_(BlockedSlot.id == slot_id, BlockedSlot.doctor_id == doctor.id)
    )
    result = await db.execute(query)
    slot = result.scalar_one_or_none()
    
    if not slot:
        raise HTTPException(status_code=404, detail="Blocked slot not found")
        
    await db.delete(slot)
    await db.commit()
