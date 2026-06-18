import asyncio
import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import async_session_factory
from app.models.doctor import Doctor

def slugify(text: str) -> str:
    # Convert to lowercase
    text = text.lower()
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Strip leading/trailing hyphens
    return text.strip('-')

async def main():
    async with async_session_factory() as session:
        result = await session.execute(select(Doctor).where(Doctor.slug.is_(None)))
        doctors = result.scalars().all()
        
        count = 0
        for doctor in doctors:
            base_slug = f"dr-{slugify(doctor.first_name)}-{slugify(doctor.last_name)}"
            slug = base_slug
            
            # Check for uniqueness
            suffix = 1
            while True:
                exists = await session.execute(select(Doctor).where(Doctor.slug == slug))
                if not exists.scalar_one_or_none():
                    break
                slug = f"{base_slug}-{suffix}"
                suffix += 1
                
            doctor.slug = slug
            count += 1
            
        await session.commit()
        print(f"Successfully generated slugs for {count} doctors.")

if __name__ == "__main__":
    asyncio.run(main())
