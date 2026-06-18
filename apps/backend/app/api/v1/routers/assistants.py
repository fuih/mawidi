import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.models.assistant import Assistant
from app.models.doctor import Doctor
from app.schemas.auth import AssistantRegister, AssistantResponse
from app.core.dependencies import get_current_clinic_user
from app.core.security import get_password_hash

router = APIRouter()

@router.get("", response_model=List[AssistantResponse])
async def get_assistants(
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all assistants for the logged-in doctor."""
    query = select(Assistant).where(Assistant.doctor_id == doctor.id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def create_assistant(
    data: AssistantRegister,
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new assistant account linked to the doctor."""
    # Check if email is taken
    existing = await db.execute(select(Assistant).where(Assistant.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already used")
        
    assistant = Assistant(
        id=uuid.uuid4(),
        doctor_id=doctor.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        password_hash=get_password_hash(data.password),
        is_active=True
    )
    db.add(assistant)
    await db.commit()
    await db.refresh(assistant)
    return assistant

@router.delete("/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assistant(
    assistant_id: uuid.UUID,
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an assistant account."""
    query = select(Assistant).where(
        and_(Assistant.id == assistant_id, Assistant.doctor_id == doctor.id)
    )
    result = await db.execute(query)
    ast = result.scalar_one_or_none()
    
    if not ast:
        raise HTTPException(status_code=404, detail="Assistant not found")
        
    await db.delete(ast)
    await db.commit()
