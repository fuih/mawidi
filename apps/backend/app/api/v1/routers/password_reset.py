from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.doctor import Doctor
from app.core.security import (
    create_password_reset_token, 
    hash_password_reset_token,
    verify_password_reset_token_expiry,
    get_password_hash,
)
from app.services.email_service import send_password_reset_email
from app.services.sms_service import send_password_reset_sms

router = APIRouter()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordSmsRequest(BaseModel):
    phone: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a password reset via email.
    Always returns success to prevent email enumeration.
    """
    result = await db.execute(select(Doctor).where(Doctor.email == data.email))
    doctor = result.scalar_one_or_none()
    
    if doctor:
        # Generate token
        raw_token = create_password_reset_token()
        
        # Hash token and store in DB for single-use validation
        hashed_token = hash_password_reset_token(raw_token)
        doctor.password_reset_token = hashed_token
        await db.commit()
        
        # Send email in background
        background_tasks.add_task(send_password_reset_email, data.email, raw_token)
        
    return {"message": "Si cette adresse est enregistrée, vous recevrez un e-mail de réinitialisation."}

@router.post("/forgot-password/sms")
async def forgot_password_sms(
    data: ForgotPasswordSmsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a password reset via SMS for Doctors.
    Always returns success to prevent phone enumeration.
    """
    result = await db.execute(select(Doctor).where(Doctor.phone == data.phone))
    doctor = result.scalar_one_or_none()
    
    if doctor and doctor.email:
        # Generate token
        raw_token = create_password_reset_token()
        
        # Hash token and store in DB for single-use validation
        hashed_token = hash_password_reset_token(raw_token)
        doctor.password_reset_token = hashed_token
        await db.commit()
        
        # Send SMS in background
        background_tasks.add_task(send_password_reset_sms, doctor.phone, raw_token)
        
    return {"message": "Si ce numéro est enregistré, vous recevrez un SMS de réinitialisation."}


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset a password using a valid, single-use token.
    """
    if not verify_password_reset_token_expiry(data.token):
        raise HTTPException(status_code=400, detail="Ce lien de réinitialisation est invalide ou a expiré.")
        
    hashed_token = hash_password_reset_token(data.token)
    result = await db.execute(select(Doctor).where(Doctor.password_reset_token == hashed_token))
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        raise HTTPException(status_code=400, detail="Ce lien de réinitialisation a déjà été utilisé ou est invalide.")

        
    # Update password and invalidate token
    doctor.password_hash = get_password_hash(data.new_password)
    doctor.password_reset_token = None
    
    await db.commit()
    return {"message": "Votre mot de passe a été réinitialisé avec succès."}
