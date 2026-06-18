from fastapi import APIRouter
from .routers import auth, search, doctors, appointments, dashboard, admin, notifications, blocked_slots, assistants, password_reset, billing, webhooks

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(password_reset.router, prefix="/auth", tags=["Auth"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(blocked_slots.router, prefix="/blocked-slots", tags=["Blocked Slots"])
api_router.include_router(assistants.router, prefix="/assistants", tags=["Assistants"])
api_router.include_router(billing.router, tags=["Billing"])
api_router.include_router(webhooks.router, tags=["Webhooks"])
