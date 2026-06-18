"""
Application configuration using Pydantic BaseSettings.
Reads from environment variables and .env file.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, model_validator


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    # ── Environment ──────────────────────────────────────────
    ENV: str = Field(default="development", description="Environment: development | production")

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/tabibak",
        description="Async PostgreSQL connection string",
    )

    # ── JWT / Auth ────────────────────────────────────────────
    SECRET_KEY: str = Field(
        default="change-me-in-production",
        description="Secret key for signing JWT tokens",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:5173"])

    # ── Project ───────────────────────────────────────────────
    PROJECT_NAME: str = "Mawidi API"
    API_V1_PREFIX: str = "/api/v1"

    # ── Frontend URL (used in emails/SMS) ─────────────────────
    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        description="Public frontend URL for links in emails and SMS",
    )

    # ── Email / SMTP ──────────────────────────────────────────
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "contact@mawidi.pro"

    # ── SMS (Sobersys) ─────────────────────────────────────────
    SOBERSYS_API_KEY: str | None = None
    SOBERSYS_SENDER_ID: str | None = None

    # ── Uploads & Cloudinary ──────────────────────────────────
    UPLOAD_DIR: str = Field(default="./media/uploads")
    CLOUDINARY_URL: str | None = Field(
        default=None, 
        description="Cloudinary URL for image uploads. If empty, local storage is used."
    )

    # ── Chargily Billing ──────────────────────────────────────
    CHARGILY_SECRET_KEY: str = Field(default="test_sk_...", description="Chargily V2 Secret Key")
    CHARGILY_PUBLIC_KEY: str = Field(default="test_pk_...", description="Chargily V2 Public Key")
    SUBSCRIPTION_PRICE_DZD: int = Field(default=5000, description="Monthly subscription price in DZD")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

    @model_validator(mode="after")
    def _validate_secret_key(self) -> "Settings":
        if self.ENV == "production" and self.SECRET_KEY == "change-me-in-production":
            raise ValueError(
                "CRITICAL: SECRET_KEY is still the default value. "
                "Set a real random secret key in your .env or environment variables before running in production."
            )
        return self


# Singleton settings instance used throughout the application.
settings = Settings()

