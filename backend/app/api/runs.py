from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.db.session import get_db
from backend.app.models.run_activity import RunActivity
from backend.app.schemas.order_run import (
    OrderRunCreate,
    OrderRunResponse,
    OrderRunDetailResponse,
    EventSignalInput,
    InstructionInput,
    WorkflowControlInput,
)
from backend.app.schemas.activity import RunActivityResponse
from backend.app.services.run_service import RunService

router = APIRouter(prefix="/runs", tags=["Order Runs"])


@router.post("", response_model=OrderRunResponse, status_code=201)
async def create_order_run(
    run_in: OrderRunCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Launch a new long-running Temporal workflow supervisor for an order.
    """
    return await RunService.create_run(db, run_in)


@router.get("", response_model=List[OrderRunResponse])
async def list_order_runs(
    status: Optional[str] = Query(None, description="Filter by status: RUNNING, SLEEPING, PAUSED, COMPLETED, TERMINATED"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    List active and completed order supervisor runs.
    """
    return await RunService.list_runs(db, status=status, limit=limit, offset=offset)


@router.get("/{run_id}", response_model=OrderRunDetailResponse)
async def get_order_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve full details of an order run including supervisor settings, memory, and activities.
    """
    return await RunService.get_run_detail(db, run_id)


@router.post("/{run_id}/events")
async def send_event_signal(
    run_id: str,
    event_in: EventSignalInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Deliver an incoming order lifecycle event signal into the running Temporal workflow.
    """
    return await RunService.send_event_signal(
        db,
        run_id,
        event_in.event_type,
        event_in.payload,
        event_in.description or "",
    )


@router.post("/{run_id}/instructions")
async def inject_instructions(
    run_id: str,
    instruction_in: InstructionInput,
    db: AsyncSession = Depends(get_db)
):
    """
    Inject mid-run operator guidance/instructions into a live workflow run.
    """
    return await RunService.send_instruction(db, run_id, instruction_in.instruction)


@router.post("/{run_id}/pause")
async def pause_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Pause an active supervisor workflow run.
    """
    return await RunService.pause_run(db, run_id)


@router.post("/{run_id}/resume")
async def resume_run(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Resume a paused supervisor workflow run.
    """
    return await RunService.resume_run(db, run_id)


@router.post("/{run_id}/terminate")
async def terminate_run(
    run_id: str,
    control_in: Optional[WorkflowControlInput] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually terminate a workflow run and trigger final retrospective generation.
    """
    reason = control_in.reason if control_in else "Operator requested termination"
    return await RunService.terminate_run(db, run_id, reason=reason)


@router.get("/{run_id}/activities", response_model=List[RunActivityResponse])
async def list_run_activities(
    run_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the chronological unified activity and audit log for an order run.
    """
    result = await db.execute(
        select(RunActivity)
        .where(RunActivity.run_id == run_id)
        .order_by(RunActivity.created_at.asc())
    )
    return list(result.scalars().all())
