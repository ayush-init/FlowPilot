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

    # Database Configuration (PostgreSQL / Supabase with asyncpg)
    # Default fallback to aiosqlite for local dev/testing if PostgreSQL URL is placeholder or unset
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./flowpilot.db",
        description="Async connection URL for PostgreSQL/Supabase (postgresql+asyncpg://...) or SQLite (sqlite+aiosqlite:///...)"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if not v or v.strip() == "" or "your_project_ref" in v or "your_supabase_password" in v:
            return "sqlite+aiosqlite:///./flowpilot.db"
        # Supabase/PostgreSQL connection string normalization
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # Google Gemini AI Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Temporal Server Configuration
    TEMPORAL_HOST: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "flowpilot-order-supervisor-queue"

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
