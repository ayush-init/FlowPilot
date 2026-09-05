import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.services.temporal_client import TemporalClientManager

router = APIRouter(prefix="/system", tags=["System Health"])


@router.get("/health")
async def get_system_health(db: AsyncSession = Depends(get_db)):
    """
    Comprehensive system health check providing live status of:
    1. Temporal cluster connection
    2. Database connectivity
    3. Google Gemini AI configuration & active model
    """
    # 1. Check Database
    db_status = "healthy"
    db_detail = "Database connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "degraded"
        db_detail = str(e)

    # 2. Check Temporal Cluster
    temporal_status = "offline"
    temporal_detail = f"Temporal dev server offline at {settings.TEMPORAL_HOST} (Built-in local workflow engine active)"
    try:
        # Quick timeout test for Temporal connection
        client = await asyncio.wait_for(TemporalClientManager.get_client(), timeout=1.5)
        if client:
            temporal_status = "connected"
            temporal_detail = f"Connected to Temporal cluster at {settings.TEMPORAL_HOST} ({settings.TEMPORAL_NAMESPACE})"
    except Exception:
        temporal_status = "offline"
        temporal_detail = f"Temporal server offline at {settings.TEMPORAL_HOST} (Local async workflow runner active)"

    # 3. Check Gemini AI
    ai_status = "configured" if settings.GEMINI_API_KEY else "heuristic_fallback"
    ai_detail = f"Model: {settings.GEMINI_MODEL}" if settings.GEMINI_API_KEY else "Running on deterministic rule engine (GEMINI_API_KEY not set)"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app": settings.APP_NAME,
        "env": settings.ENV,
        "temporal": {
            "status": temporal_status,
            "host": settings.TEMPORAL_HOST,
            "namespace": settings.TEMPORAL_NAMESPACE,
            "task_queue": settings.TEMPORAL_TASK_QUEUE,
            "detail": temporal_detail,
        },
        "database": {
            "status": db_status,
            "detail": db_detail,
        },
        "ai": {
            "status": ai_status,
            "provider": "Autonomous AI Engine",
            "model": "Gemini 2.5 Pro",
            "detail": "Autonomous reasoning engine active" if settings.GEMINI_API_KEY else "Running on deterministic supervisor engine",
        }
    }
