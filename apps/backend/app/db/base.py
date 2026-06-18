"""
Import Base and all models so that Alembic's ``target_metadata`` can see every table.
"""

from app.models.base import Base  # noqa: F401
from app.models.doctor import Doctor  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.working_hours import WorkingHours  # noqa: F401
from app.models.appointment import Appointment  # noqa: F401
from app.models.blocked_slot import BlockedSlot  # noqa: F401
