from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.session import get_db
from app.models.doctor import Doctor
from app.schemas import doctor as doctor_schemas
from app.schemas.common import Specialty, City

router = APIRouter()


@router.get("/doctors", response_model=List[doctor_schemas.DoctorSearchResult])
async def search_doctors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    name: Optional[str] = None,
    gender: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Doctor).where(
        Doctor.is_active == True, 
        Doctor.is_verified == True,
        Doctor.subscription_status.in_(["trial", "active"])
    )
    
    if specialty:
        query = query.where(Doctor.specialty == specialty)
    if city:
        query = query.where(Doctor.city == city)
    if gender:
        query = query.where(Doctor.gender.ilike(gender))
    if name:
        name_filter = f"%{name}%"
        query = query.where(
            or_(
                Doctor.first_name.ilike(name_filter),
                Doctor.last_name.ilike(name_filter),
                Doctor.first_name_ar.ilike(name_filter),
                Doctor.last_name_ar.ilike(name_filter),
                Doctor.specialty.ilike(name_filter)
            )
        )
    
    result = await db.execute(query)
    doctors = result.scalars().all()
    return doctors


@router.get("/specialties", response_model=List[str])
async def get_specialties():
    """List all available specialties."""
    return [s.value for s in Specialty]


@router.get("/cities", response_model=List[str])
async def get_cities():
    """List all available cities."""
    return [c.value for c in City]
