import asyncio
import uuid
from app.db.session import engine
from app.models.base import Base
from app.models.admin import Admin
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.assistant import Assistant
from app.core.security import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

async def seed():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Create Admin
        admin = Admin(
            email="admin@mawidi.pro",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        session.add(admin)

        # Create Doctor 1 (Dentist)
        doc1 = Doctor(
            id=uuid.uuid4(),
            email="dr.dentist@mawidi.pro",
            password_hash=get_password_hash("doctor123"),
            first_name="Amine",
            last_name="Brahimi",
            first_name_ar="أمين",
            last_name_ar="براهيمي",
            phone="0555111222",
            specialty="Dentiste",
            city="Alger",
            address="Rue Didouche Mourad, Alger Centre",
            is_active=True,
            is_verified=True,
            consultation_fee=2500
        )
        session.add(doc1)

        # Create Assistant for Doctor 1
        asst1 = Assistant(
            id=uuid.uuid4(),
            doctor_id=doc1.id,
            first_name="Sarah",
            last_name="Mansouri",
            email="sarah.assistant@mawidi.pro",
            phone="0777111222",
            password_hash=get_password_hash("assistant123"),
            is_active=True
        )
        session.add(asst1)

        # Create Doctor 2 (Cardiologist)
        doc2 = Doctor(
            id=uuid.uuid4(),
            email="dr.cardio@mawidi.pro",
            password_hash=get_password_hash("doctor123"),
            first_name="Nadia",
            last_name="Saidi",
            first_name_ar="نادية",
            last_name_ar="سعيدي",
            phone="0666333444",
            specialty="Cardiologue",
            city="Oran",
            address="Boulevard de la Soummam, Oran",
            is_active=True,
            is_verified=True,
            consultation_fee=3000
        )
        session.add(doc2)

        # Create Patient 1
        pat1 = Patient(
            id=uuid.uuid4(),
            email="patient.mohamed@mawidi.pro",
            password_hash=get_password_hash("patient123"),
            first_name="Mohamed",
            last_name="Ali",
            phone="0555999888"
        )
        session.add(pat1)

        await session.commit()
        print("Database seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
