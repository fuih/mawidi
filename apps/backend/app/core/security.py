"""
Security utilities: JWT token creation/verification and password hashing.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password hashing context ────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── JWT constants ────────────────────────────────────────────────
ALGORITHM = "HS256"
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
TOKEN_TYPE_EMAIL_VERIFICATION = "email_verification"
TOKEN_TYPE_PASSWORD_RESET = "password_reset"


# ── Password helpers ────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare a plain-text password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Return the bcrypt hash for a plain-text password."""
    return pwd_context.hash(password)


# ── Token helpers ────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Create a short-lived JWT access token.

    Args:
        data: Payload dict – must contain "sub" (subject / user id) and "type" (doctor/patient).
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "token_type": TOKEN_TYPE_ACCESS})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived JWT refresh token.

    Args:
        data: Payload dict – must contain "sub" (subject / user id) and "type" (doctor/patient).
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "token_type": TOKEN_TYPE_REFRESH})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    """Decode and validate a JWT token.

    Returns:
        The decoded payload dict on success, or None if the token is invalid / expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        sub: str | None = payload.get("sub")
        if sub is None:
            return None
        return payload
    except JWTError:
        return None


def create_verification_token(email: str) -> str:
    """Create a short-lived JWT for email verification."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {
        "sub": email,
        "type": TOKEN_TYPE_EMAIL_VERIFICATION,
        "exp": expire
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def verify_verification_token(token: str) -> str | None:
    """Decode and validate an email verification token.

    Returns:
        The email address (sub) on success, or None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != TOKEN_TYPE_EMAIL_VERIFICATION:
            return None
        return payload.get("sub")
    except JWTError:
        return None


import secrets
import time
import hashlib

def create_password_reset_token() -> str:
    """Create a short, opaque urlsafe token with embedded timestamp."""
    timestamp = int(time.time())
    random_str = secrets.token_urlsafe(32)
    return f"{timestamp}.{random_str}"


def hash_password_reset_token(token: str) -> str:
    """Hash the opaque token for safe DB storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_password_reset_token_expiry(token: str) -> bool:
    """Check if the opaque token is valid and not expired (15 mins)."""
    try:
        timestamp_str, _ = token.split(".")
        timestamp = int(timestamp_str)
    except ValueError:
        return False
        
    if time.time() - timestamp > 15 * 60: # 15 minutes
        return False
    return True
