from datetime import datetime, timezone, timedelta
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

@router.post("/verify")
async def verify_payment(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):
    """
    Check the doctor's most recent pending payment and verify its status synchronously with Chargily.
    This acts as a fallback for when webhooks fail (e.g. localhost testing).
    """
    result = await db.execute(
        select(Payment)
        .where(Payment.doctor_id == current_doctor.id, Payment.status == "pending")
    )
    pending_payments = result.scalars().all()
    
    if not pending_payments:
        return {"status": "no_pending_payment"}
        
    any_paid = False
    newest_end_date = None
    last_status = "pending"
    
    for payment in pending_payments:
        chargily_status = await chargily_service.get_checkout_status(payment.checkout_id)
        last_status = chargily_status
        
        if chargily_status == "paid":
            any_paid = True
            payment.status = "paid"
            payment.completed_at = datetime.now(timezone.utc)
            
            # Update Doctor Subscription
            now = datetime.now(timezone.utc)
            current_end_date = current_doctor.subscription_end_date
            
            if current_end_date and current_end_date.tzinfo is None:
                current_end_date = current_end_date.replace(tzinfo=timezone.utc)
                
            base_date = now
            if current_end_date and current_end_date > now:
                base_date = current_end_date
                
            new_end_date = base_date + timedelta(days=30)
            
            current_doctor.subscription_status = "active"
            current_doctor.subscription_end_date = new_end_date
            newest_end_date = new_end_date
            
            from app.models.notification import Notification
            notification = Notification(
                doctor_id=current_doctor.id,
                message=f"Paiement reçu ! Votre abonnement a été renouvelé avec succès jusqu'au {new_end_date.strftime('%d/%m/%Y')}."
            )
            db.add(notification)
            
    if any_paid:
        await db.commit()
        return {"status": "success", "new_end_date": newest_end_date}
        
    return {"status": last_status}
