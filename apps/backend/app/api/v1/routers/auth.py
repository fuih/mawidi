# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
from app.db.session import get_db
from app.schemas import auth as auth_schemas
from app.services import auth_service
from app.services.email_service import send_verification_email, send_welcome_email
from app.services.sms_service import send_welcome_sms
from app.core.security import verify_verification_token, create_verification_token
from app.core.dependencies import get_current_clinic_user, get_current_patient
from app.core.limiter import limiter
from fastapi import Request, Response
import secrets
from app.models.doctor import Doctor
from app.models.patient import Patient
from pydantic import BaseModel
from app.core.config import settings
router = APIRouter()

@router.get("/patient/me")
async def get_patient_profile(
    current_patient: Patient = Depends(get_current_patient),
):
    """Return the logged-in patient's profile (for pre-filling booking form)."""
    return {
        "id": str(current_patient.id),
        "first_name": current_patient.first_name,
        "last_name": current_patient.last_name,
        "phone": current_patient.phone,
        "email": current_patient.email,
    }


@router.post("/register")
@limiter.limit("5/minute")
async def register_doctor(
    request: Request,
    doctor_in: auth_schemas.DoctorRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new doctor (account is pending admin verification)."""
    return await auth_service.register_doctor(db, doctor_in)


@router.post("/login")
@limiter.limit("5/minute")
async def login_doctor(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """OAuth2 compatible token login, get an access token for future requests."""
    tokens = await auth_service.authenticate_doctor(db, form_data.username, form_data.password)
    if not tokens:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    is_prod = settings.ENV == "production"
    
    # Set HttpOnly cookies for JWTs
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    
    # Set CSRF token
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=is_prod, samesite="lax")
    
    return {"message": "Successfully logged in", "type": "doctor"}


@router.post("/patient/register")
@limiter.limit("5/minute")
async def register_patient(
    request: Request,
    response: Response,
    patient_in: auth_schemas.PatientRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new patient."""
    tokens = await auth_service.register_patient(db, patient_in)
    
    is_prod = settings.ENV == "production"
    
    # Set HttpOnly cookies for JWTs
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    
    # Set CSRF token
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=is_prod, samesite="lax")
    
    return {"message": "Successfully registered and logged in", "type": "patient"}


@router.post("/patient/login")
@limiter.limit("5/minute")
async def login_patient(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login for patients (username should be phone number)."""
    tokens = await auth_service.authenticate_patient(db, form_data.username, form_data.password)
    if not tokens:
        raise HTTPException(status_code=400, detail="Incorrect phone or password")
    
    is_prod = settings.ENV == "production"
    
    # Set HttpOnly cookies for JWTs
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    
    # Set CSRF token (not HttpOnly, readable by frontend)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=is_prod, samesite="lax")
    
    return {"message": "Successfully logged in", "type": "patient"}


@router.post("/refresh")
async def refresh_tokens(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using the HttpOnly refresh_token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token found")
        
    tokens = await auth_service.refresh_tokens(db, refresh_token)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    is_prod = settings.ENV == "production"
    
    # Set new cookies
    response.set_cookie(key="access_token", value=tokens["access_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_prod, samesite="lax", max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    
    return {"message": "Tokens refreshed"}

@router.post("/logout")
async def logout(response: Response):
    """Log out by clearing cookies."""
    response.delete_cookie(key="access_token", samesite="lax")
    response.delete_cookie(key="refresh_token", samesite="lax")
    response.delete_cookie(key="csrf_token", samesite="lax")
    return {"message": "Logged out"}

@router.get("/me")
async def get_current_user_state(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Fast endpoint for frontend to check if logged in and user type."""
    from app.core.dependencies import oauth2_doctor_scheme
    from app.core.security import verify_token
    token = request.cookies.get("access_token")
    if not token:
        return {"logged_in": False}
        
    payload = verify_token(token)
    if not payload:
        return {"logged_in": False}
        
    return {
        "logged_in": True,
        "type": payload.get("type"),
        "sub": payload.get("sub")
    }


class VerifyEmailRequest(BaseModel):
    token: str

@router.post("/verify-email")
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify a doctor's email address using a token."""
    email = verify_verification_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Lien de vérification invalide ou expiré")
        
    result = await db.execute(select(Doctor).where(Doctor.email == email))
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
        
    if doctor.is_verified:
        return {"message": "Adresse e-mail déjà vérifiée"}
        
    doctor.is_verified = True
    await db.commit()
    
    return {"message": "Adresse e-mail vérifiée avec succès"}


@router.post("/verify-email/resend")
async def resend_verification_email(
    email: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Resend the verification email to an unverified doctor."""
    result = await db.execute(select(Doctor).where(Doctor.email == email))
    doctor = result.scalar_one_or_none()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
        
    if doctor.is_verified:
        raise HTTPException(status_code=400, detail="Cette adresse est déjà vérifiée")
        
    verification_token = create_verification_token(email)
    background_tasks.add_task(send_verification_email, email, verification_token)
    return {"message": "E-mail de vérification envoyé"}
