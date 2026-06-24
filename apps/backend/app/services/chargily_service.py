import hmac
import hashlib
import json
import logging
import httpx
from typing import Dict, Any

from app.core.config import settings
from app.models.doctor import Doctor

logger = logging.getLogger(__name__)

CHARGILY_BASE_URL = "https://pay.chargily.net/test/api/v2" if settings.ENV != "production" else "https://pay.chargily.net/api/v2"

async def create_checkout_session(doctor: Doctor, amount: int) -> Dict[str, Any]:
    """
    Create a Chargily V2 Checkout session for the given doctor.
    Returns the parsed JSON response containing the checkout URL and ID.
    """
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    backend_url = "https://mawidi.pro" if settings.ENV == "production" else "https://free-turtles-like.loca.lt"
    
    payload = {
        "amount": amount,
        "currency": "dzd",
        "success_url": f"{frontend_url}/dashboard/billing?status=success",
        "failure_url": f"{frontend_url}/dashboard/billing?status=failure",
        # Some versions of Chargily V2 allow dynamic webhook endpoint.
        "webhook_endpoint": f"{backend_url}{settings.API_V1_PREFIX}/webhooks/chargily",
        "description": "Abonnement Mawidi (1 mois)",
        "metadata": [
            {"doctor_id": str(doctor.id)}
        ]
    }

    headers = {
        "Authorization": f"Bearer {settings.CHARGILY_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{CHARGILY_BASE_URL}/checkouts", json=payload, headers=headers)
        
        if response.status_code >= 400:
            logger.error(f"Chargily checkout failed: {response.text}")
            response.raise_for_status()

        return response.json()

def verify_webhook_signature(payload: str, signature: str) -> bool:
    """
    Verify the HMAC SHA-256 signature from Chargily webhooks.
    """
    if not signature:
        return False
        
    secret = settings.CHARGILY_SECRET_KEY.encode('utf-8')
    message = payload.encode('utf-8')
    
    computed_signature = hmac.new(
        secret,
        message,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_signature, signature)

async def get_checkout_status(checkout_id: str) -> str:
    """
    Fetch the real-time status of a checkout from Chargily.
    """
    headers = {
        "Authorization": f"Bearer {settings.CHARGILY_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CHARGILY_BASE_URL}/checkouts/{checkout_id}", headers=headers)
            if response.status_code == 200:
                return response.json().get("status", "unknown")
        except Exception as e:
            logger.error(f"Error checking checkout status: {str(e)}")
            
    return "unknown"
