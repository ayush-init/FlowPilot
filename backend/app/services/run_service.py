import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.models.order_run import OrderRun
from backend.app.models.supervisor import Supervisor
from backend.app.models.run_activity import RunActivity
from backend.app.schemas.order_run import OrderRunCreate, EventSignalInput, InstructionInput
from backend.app.services.temporal_client import get_temporal_client
from backend.app.temporal.workflows import OrderSupervisorWorkflow


class RunService:

    @staticmethod
    async def create_run(db: AsyncSession, run_in: OrderRunCreate) -> OrderRun:
        # 1. Resolve supervisor
        supervisor = None
        if run_in.supervisor_id:
            result = await db.execute(
                select(Supervisor).where(Supervisor.id == run_in.supervisor_id)
            )
            supervisor = result.scalar_one_or_none()
            if not supervisor:
                raise HTTPException(status_code=404, detail=f"Supervisor '{run_in.supervisor_id}' not found.")
        else:
            # Default to first available supervisor
            result = await db.execute(select(Supervisor).limit(1))
            supervisor = result.scalar_one_or_none()

        # 2. Generate unique workflow ID
        workflow_id = f"flowpilot-order-{run_in.order_id}-{uuid.uuid4().hex[:8]}"

        # 3. Create database record
        order_run = OrderRun(
            order_id=run_in.order_id,
            supervisor_id=supervisor.id if supervisor else None,
            temporal_workflow_id=workflow_id,
            status="INITIALIZING",
            compact_memory=f"Order #{run_in.order_id} placed. Supervisor assigned: {supervisor.name if supervisor else 'Default'}.",
            current_state=run_in.order_details,
            extra_instructions=run_in.initial_instructions or ""
        )
        db.add(order_run)
        await db.flush()  # Populates order_run.id

        # 4. Start Temporal Workflow
        try:
            client = await get_temporal_client()
            await client.start_workflow(
                OrderSupervisorWorkflow.run,
                {
                    "run_id": order_run.id,
                    "order_id": order_run.order_id,
                    "order_details": run_in.order_details,
                    "aggressiveness": supervisor.aggressiveness if supervisor else "balanced",
                    "default_wakeup_interval_seconds": supervisor.default_wakeup_interval_seconds if supervisor else 7200,
                },
                id=workflow_id,
                task_queue=settings.TEMPORAL_TASK_QUEUE
            )
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=503,
                detail=f"Could not start Temporal workflow '{workflow_id}'. Is Temporal running on {settings.TEMPORAL_HOST}? Details: {e}"
            )

        await db.commit()
        await db.refresh(order_run)
        return order_run

    @staticmethod
    async def list_runs(
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[OrderRun]:
        query = select(OrderRun).order_by(desc(OrderRun.created_at)).limit(limit).offset(offset)
        if status:
            query = query.where(OrderRun.status == status.upper())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_run_detail(db: AsyncSession, run_id: str) -> OrderRun:
        result = await db.execute(
            select(OrderRun)
            .options(
                selectinload(OrderRun.supervisor),
                selectinload(OrderRun.activities)
            )
            .where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found.")
        return run

    @staticmethod
    async def send_event_signal(
        db: AsyncSession,
        run_id: str,
        event_in: EventSignalInput
    ) -> Dict[str, Any]:
        run = await RunService.get_run_detail(db, run_id)
        if run.status in ["COMPLETED", "TERMINATED"]:
            raise HTTPException(status_code=400, detail=f"Cannot signal a workflow with terminal status '{run.status}'.")

        try:
            client = await get_temporal_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal(
                OrderSupervisorWorkflow.signal_event,
                {
                    "event_type": event_in.event_type,
                    "payload": event_in.payload,
                    "description": event_in.description
                }
            )
            return {"status": "signal_dispatched", "run_id": run_id, "event_type": event_in.event_type}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to signal workflow: {e}")

    @staticmethod
    async def send_instruction(
        db: AsyncSession,
        run_id: str,
        instruction_in: InstructionInput
    ) -> Dict[str, Any]:
        run = await RunService.get_run_detail(db, run_id)
        if run.status in ["COMPLETED", "TERMINATED"]:
            raise HTTPException(status_code=400, detail=f"Cannot inject instructions into a terminal workflow.")

        try:
            client = await get_temporal_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal(
                OrderSupervisorWorkflow.signal_instruction,
                instruction_in.instruction
            )
            return {"status": "instruction_dispatched", "run_id": run_id, "instruction": instruction_in.instruction}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to inject instruction: {e}")

    @staticmethod
    async def pause_run(db: AsyncSession, run_id: str) -> Dict[str, Any]:
        run = await RunService.get_run_detail(db, run_id)
        try:
            client = await get_temporal_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal(OrderSupervisorWorkflow.signal_pause)
            return {"status": "pause_requested", "run_id": run_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to pause workflow: {e}")

    @staticmethod
    async def resume_run(db: AsyncSession, run_id: str) -> Dict[str, Any]:
        run = await RunService.get_run_detail(db, run_id)
        try:
            client = await get_temporal_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal(OrderSupervisorWorkflow.signal_resume)
            return {"status": "resume_requested", "run_id": run_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to resume workflow: {e}")

    @staticmethod
    async def terminate_run(db: AsyncSession, run_id: str, reason: str = "Manual termination") -> Dict[str, Any]:
        run = await RunService.get_run_detail(db, run_id)
        try:
            client = await get_temporal_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal(OrderSupervisorWorkflow.signal_terminate, reason)
            return {"status": "termination_requested", "run_id": run_id, "reason": reason}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to terminate workflow: {e}")
