import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.payment import Payment
from app.models.doctor import Doctor
from app.services import chargily_service

from app.models.notification import Notification

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

@router.post("/chargily")
async def chargily_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle asynchronous payment confirmations from Chargily V2."""
    
    # 1. Read signature header
    signature = request.headers.get("signature")
    if not signature:
        logger.warning("Chargily webhook missing signature header.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature")

    # 2. Read raw payload
    raw_payload = await request.body()
    
    # 3. Verify signature BEFORE any DB lookup
    if not chargily_service.verify_webhook_signature(raw_payload.decode('utf-8'), signature):
        logger.error("Chargily webhook signature verification failed.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    # 4. Parse payload
    try:
        payload = json.loads(raw_payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event_type = payload.get("type")
    
    # We only care about checkout.paid events for now
    if event_type != "checkout.paid":
        return {"status": "ignored", "reason": "Not checkout.paid"}

    data = payload.get("data", {})
    checkout_id = data.get("id")

    if not checkout_id:
        return {"status": "ignored", "reason": "Missing checkout ID"}

    # 5. DB Lookup
    result = await db.execute(
        select(Payment).where(Payment.checkout_id == str(checkout_id))
    )
    payment = result.scalars().first()

    if not payment:
        logger.error(f"Payment record not found for checkout {checkout_id}")
        return {"status": "error", "reason": "Payment not found"}

    # 6. Idempotency Check
    if payment.status == "paid":
        logger.info(f"Webhook received for already paid checkout {checkout_id}. Ignoring.")
        return {"status": "success", "message": "Already processed"}

    # 7. Update Payment
    payment.status = "paid"
    payment.completed_at = datetime.now(timezone.utc)
    
    # 8. Update Doctor Subscription
    doctor = await db.get(Doctor, payment.doctor_id)
    if doctor:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # If doctor has an active subscription ending in the future, extend it.
        # Otherwise, start from today.
        current_end_date = doctor.subscription_end_date
        
        # Ensure we're comparing timezone-naive datetimes
        if current_end_date and current_end_date.tzinfo is not None:
            current_end_date = current_end_date.replace(tzinfo=None)
            
        base_date = now
        if current_end_date and current_end_date > now:
            base_date = current_end_date
            
        new_end_date = base_date + timedelta(days=30)
        
        doctor.subscription_status = "active"
        doctor.subscription_end_date = new_end_date
        
        # Create an in-app notification
        notification = Notification(
            doctor_id=doctor.id,
            message=f"Paiement reçu ! Votre abonnement a été renouvelé avec succès jusqu'au {new_end_date.strftime('%d/%m/%Y')}."
        )
        db.add(notification)
        
        logger.info(f"Doctor {doctor.id} subscription renewed until {new_end_date}")

    await db.commit()
    
    return {"status": "success"}
