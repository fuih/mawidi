import asyncio
import httpx
import json
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from app.db.session import async_session_factory
from app.models.payment import Payment

async def main():
    print("Fixing missing trial end dates in DB...")
    # Fix the missing trial date for the old doctor account
    async with async_session_factory() as db:
        from sqlalchemy import text
        await db.execute(text("UPDATE doctors SET subscription_end_date = datetime('now', '+14 days') WHERE subscription_end_date IS NULL"))
        await db.commit()
        
        # Grab the latest pending payment to simulate
        from sqlalchemy import select
        result = await db.execute(select(Payment).where(Payment.status == "pending").order_by(Payment.created_at.desc()).limit(1))
        payment = result.scalar_one_or_none()
        
    print("DB dates fixed!")
        
    if not payment:
        print("No pending payment found. Please click 'Payer avec CIB' on the frontend first!")
        return
        
    print(f"Simulating webhook for checkout ID: {payment.checkout_id}")
    
    # 1. Create the exact payload Chargily would send
    payload = {
        "id": "evt_test123",
        "type": "checkout.paid",
        "data": {
            "id": payment.checkout_id,
            "status": "paid",
            "amount": int(payment.amount),
            "currency": "dzd"
        }
    }
    
    payload_str = json.dumps(payload)
    
    # 2. Compute the HMAC signature using your secret key
    secret = settings.CHARGILY_SECRET_KEY.encode('utf-8')
    signature = hmac.new(secret, payload_str.encode('utf-8'), hashlib.sha256).hexdigest()
    
    # 3. Send it to the local FastAPI app
    print("Sending webhook to http://127.0.0.1:8000/api/v1/webhooks/chargily...")
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://127.0.0.1:8000/api/v1/webhooks/chargily",
            content=payload_str,
            headers={
                "signature": signature,
                "Content-Type": "application/json"
            }
        )
        print(f"Response status: {res.status_code}")
        print(f"Response body: {res.text}")

if __name__ == "__main__":
    asyncio.run(main())
