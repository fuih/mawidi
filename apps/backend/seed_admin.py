import asyncio
import uuid
from app.db.session import async_session_factory
from app.models.admin import Admin
from app.core.security import get_password_hash

async def seed_admin():
    async with async_session_factory() as db:
        admin_id = uuid.uuid4()
        admin = Admin(
            id=admin_id,
            email="admin@tabibak.pro",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin)
        await db.commit()
        print(f"Admin created successfully! Email: admin@tabibak.pro, Password: admin123")

if __name__ == "__main__":
    asyncio.run(seed_admin())
