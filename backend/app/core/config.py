from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "FlowPilot Backend"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    API_V1_PREFIX: str = "/api"

    # Database Configuration (PostgreSQL / Supabase / Neon with asyncpg)
    # Default fallback to aiosqlite for local dev/testing if PostgreSQL URL is placeholder or unset
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./flowpilot.db",
        description="Async connection URL for PostgreSQL/Supabase/Neon (postgresql+asyncpg://...) or SQLite (sqlite+aiosqlite:///...)"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v or v.strip() == "" or "your_project_ref" in v or "your_supabase_password" in v:
            return "sqlite+aiosqlite:///./flowpilot.db"
        
        # Clean quotes
        v = v.strip().strip("'\"")

        # Neon / Supabase / PostgreSQL connection string normalization
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Normalize sslmode for asyncpg
        if "sslmode=require" in v:
            v = v.replace("sslmode=require", "ssl=require")
        
        # Strip libpq-specific flags unsupported by asyncpg
        if "&channel_binding=require" in v:
            v = v.replace("&channel_binding=require", "")
        elif "?channel_binding=require&" in v:
            v = v.replace("channel_binding=require&", "")
        elif "?channel_binding=require" in v:
            v = v.replace("?channel_binding=require", "")

        return v

    # Google Gemini AI Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Temporal Server Configuration
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "flowpilot-order-supervisor-queue"

    # Authentication & Session Settings
    SESSION_SECRET: str = "flowpilot-super-secret-session-key-2026-prod-secure"
    SESSION_MAX_AGE_SECONDS: int = 60 * 60 * 24 * 7  # 7 days
    SESSION_COOKIE_NAME: str = "flowpilot_session"
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
