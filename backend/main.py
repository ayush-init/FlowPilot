from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.db.init_db import init_db
from backend.app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB schema & default supervisor templates
    print("[SERVER] Initializing database and template seeds...")
    await init_db()
    print("[SERVER] FlowPilot backend is ready!")
    yield
    # Shutdown
    print("[SERVER] Shutting down FlowPilot backend.")


app = FastAPI(
    title="FlowPilot - AI Order Supervisor API",
    description="""
    FlowPilot is an event-driven, long-running AI Order Supervisor backend powered by:
    - **Temporal Python SDK** for durable sleep, scheduled wakeups, and signal handling.
    - **Google Gemini API** with structured tool calling for 5 business actions.
    - **PostgreSQL / Supabase (with asyncpg)** for persistent runs, memory, and activity logs.
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router under /api prefix
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.ENV,
        "database": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
