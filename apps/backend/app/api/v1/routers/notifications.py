import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_

from app.db.session import get_db
from app.models.notification import Notification
from app.models.doctor import Doctor
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.core.dependencies import get_current_clinic_user

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all notifications for the current doctor."""
    
    # Get all notifications ordered by newest first
    query = select(Notification).where(
        Notification.doctor_id == doctor.id
    ).order_by(Notification.created_at.desc()).limit(50)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Get unread count
    count_query = select(func.count()).select_from(Notification).where(
        and_(Notification.doctor_id == doctor.id, Notification.is_read == False)
    )
    count_result = await db.execute(count_query)
    unread_count = count_result.scalar() or 0
    
    return NotificationListResponse(
        items=notifications,
        unread_count=unread_count
    )

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a specific notification as read."""
    query = select(Notification).where(
        and_(Notification.id == notification_id, Notification.doctor_id == doctor.id)
    )
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification

@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    doctor: Doctor = Depends(get_current_clinic_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read for the current doctor."""
    stmt = update(Notification).where(
        and_(Notification.doctor_id == doctor.id, Notification.is_read == False)
    ).values(is_read=True)
    
    await db.execute(stmt)
    await db.commit()
