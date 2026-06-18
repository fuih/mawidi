import asyncio
import sys
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import async_session_factory
from app.models.doctor import Doctor
from app.models.working_hours import WorkingHours

async def main():
    async with async_session_factory() as session:
        result = await session.execute(select(Doctor))
        doctors = result.scalars().all()
        for d in doctors:
            wh_result = await session.execute(select(WorkingHours).where(WorkingHours.doctor_id == d.id))
            wh = wh_result.scalars().all()
            print(f"Doctor {d.first_name} {d.last_name} ({d.slug}) has {len(wh)} working days configured.")

if __name__ == "__main__":
    asyncio.run(main())
