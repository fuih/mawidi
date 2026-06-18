from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.models.doctor import Doctor
from app.models.payment import Payment
from app.core.dependencies import get_current_doctor
from app.services import chargily_service

router = APIRouter(prefix="/billing", tags=["Billing"])

class CheckoutResponse(BaseModel):
    checkout_url: str

class BillingStatusResponse(BaseModel):
    subscription_status: str
    subscription_end_date: datetime | None
    price_dzd: int

@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Get the current doctor's subscription status."""
    return BillingStatusResponse(
        subscription_status=current_doctor.subscription_status,
        subscription_end_date=current_doctor.subscription_end_date,
        price_dzd=settings.SUBSCRIPTION_PRICE_DZD,
    )

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """Generate a payment link via Chargily."""
    # Check if a pending payment already exists to avoid spamming the API? Optional for MVP.
    
    amount = settings.SUBSCRIPTION_PRICE_DZD
    
    try:
        checkout_data = await chargily_service.create_checkout_session(current_doctor, amount)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de contacter le service de paiement (Chargily)."
        )

    # Chargily V2 response typically contains 'checkout_url' and 'id'
    checkout_url = checkout_data.get("checkout_url")
    checkout_id = checkout_data.get("id")

    if not checkout_url or not checkout_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Réponse invalide du service de paiement."
        )

    # Create Payment record
    payment = Payment(
        doctor_id=current_doctor.id,
        checkout_id=str(checkout_id),
        amount=amount,
        status="pending"
    )
    db.add(payment)
    await db.commit()

    return CheckoutResponse(checkout_url=checkout_url)
