import asyncio
import logging
from datetime import datetime, timezone
import sys
import os

# Add the project root to the python path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session_factory
from app.models.doctor import Doctor
from sqlalchemy import select, update

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_expiry_check():
    """
    Finds all doctors whose subscription_end_date has passed
    and their status is 'trial' or 'active', and transitions them to 'past_due'.
    """
    now = datetime.now(timezone.utc)
    
    async with async_session_factory() as db:
        # Select doctors whose end date is past
        query = select(Doctor).where(
            Doctor.subscription_end_date < now,
            Doctor.subscription_status.in_(["trial", "active"])
        )
        
        result = await db.execute(query)
        expired_doctors = result.scalars().all()
        
        if not expired_doctors:
            logger.info("No expired subscriptions found.")
            return

        logger.info(f"Found {len(expired_doctors)} expired subscriptions. Updating...")

        for doc in expired_doctors:
            doc.subscription_status = "past_due"
            logger.info(f"Doctor {doc.id} ({doc.email}) moved to past_due.")
            
        await db.commit()
        logger.info("Done updating subscriptions.")

if __name__ == "__main__":
    asyncio.run(run_expiry_check())
