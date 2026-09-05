import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from backend.app.models.order_run import OrderRun
from backend.app.models.supervisor import Supervisor
from backend.app.models.run_activity import RunActivity
from backend.app.schemas.order_run import OrderRunCreate
from backend.app.services.temporal_client import TemporalClientManager
from backend.app.core.config import settings
from backend.app.agent.classifier import EventClassifier
from backend.app.agent.reasoner import AgentReasoner
from backend.app.agent.memory import MemoryManager
from backend.app.db.session import AsyncSessionLocal


# In-memory signal queues and active worker tasks for durable local execution
_SIGNAL_QUEUES: Dict[str, asyncio.Queue] = {}
_ACTIVE_TASKS: Dict[str, asyncio.Task] = {}


class RunService:

    @staticmethod
    async def create_run(db: AsyncSession, run_in: OrderRunCreate) -> OrderRun:
        # 1. Fetch supervisor
        supervisor = None
        if run_in.supervisor_id:
            res = await db.execute(select(Supervisor).where(Supervisor.id == run_in.supervisor_id))
            supervisor = res.scalar_one_or_none()

        if not supervisor:
            res = await db.execute(select(Supervisor).limit(1))
            supervisor = res.scalar_one_or_none()

        if not supervisor:
            raise HTTPException(status_code=400, detail="No supervisor template available. Please seed database.")

        workflow_id = f"flowpilot-order-{run_in.order_id}-{uuid4().hex[:8]}"

        # 2. Insert Run into DB
        order_run = OrderRun(
            order_id=run_in.order_id,
            supervisor_id=supervisor.id,
            temporal_workflow_id=workflow_id,
            status="RUNNING",
            compact_memory=f"Order #{run_in.order_id} placed for customer {run_in.order_details.get('customer_name', 'Customer')}. Item: {run_in.order_details.get('item', 'Item')} (${run_in.order_details.get('amount', 0)}).",
            current_state=run_in.order_details,
            extra_instructions=run_in.initial_instructions or "",
            next_wakeup_at=datetime.now(timezone.utc) + timedelta(seconds=supervisor.default_wakeup_interval_seconds)
        )
        db.add(order_run)
        await db.commit()
        await db.refresh(order_run)

        # 3. Log initial activity
        init_act = RunActivity(
            run_id=order_run.id,
            activity_type="WORKFLOW_STATE_CHANGE",
            title="Order Supervisor Workflow Started",
            content=f"Workflow initialized with supervisor '{supervisor.name}'. Base policy loaded.",
            metadata_json={"order_details": run_in.order_details, "supervisor": supervisor.name}
        )
        db.add(init_act)
        await db.commit()

        # 4. Attempt to start Temporal Workflow or fallback to Async Workflow Engine
        try:
            client = await TemporalClientManager.get_client()
            from backend.app.temporal.workflows import OrderSupervisorWorkflow
            await client.start_workflow(
                OrderSupervisorWorkflow.run,
                args=[
                    str(order_run.id),
                    order_run.order_id,
                    supervisor.name,
                    supervisor.base_instruction,
                    supervisor.aggressiveness,
                    supervisor.default_wakeup_interval_seconds,
                    run_in.order_details,
                    order_run.extra_instructions
                ],
                id=workflow_id,
                task_queue=settings.TEMPORAL_TASK_QUEUE
            )
            print(f"[TEMPORAL] Workflow '{workflow_id}' started in live cluster.")
        except Exception as e:
            print(f"[WORKFLOW] Temporal server offline ({e}). Running via built-in Async Workflow Engine.")
            RunService._ensure_local_workflow(str(order_run.id), is_brand_new=True)

        return await RunService.get_run_detail(db, order_run.id)

    @staticmethod
    def _ensure_local_workflow(run_id: str, is_brand_new: bool = False) -> asyncio.Queue:
        """
        Start or return the in-process fallback workflow engine for demos where
        the Temporal dev server is not running.
        """
        queue = _SIGNAL_QUEUES.setdefault(run_id, asyncio.Queue())
        task = _ACTIVE_TASKS.get(run_id)
        if task is None or task.done():
            _ACTIVE_TASKS[run_id] = asyncio.create_task(RunService._run_local_workflow(run_id, queue, is_brand_new))
        return queue

    @staticmethod
    async def _run_local_workflow(run_id: str, queue: asyncio.Queue, is_brand_new: bool = False):
        """Durable local async state machine executing when Temporal cluster is offline."""
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                run = res.scalar_one_or_none()
                if not run:
                    return
                sup_res = await session.execute(select(Supervisor).where(Supervisor.id == run.supervisor_id))
                supervisor = sup_res.scalar_one()

            # 1. Trigger 1: Workflow Start Agent Reasoning (Only if brand new run)
            if is_brand_new:
                start_inference = await AgentReasoner.infer(
                    order_id=run.order_id,
                    trigger="WORKFLOW_START",
                    event_info={"order_details": run.current_state},
                    compact_memory=run.compact_memory,
                    current_state=run.current_state,
                    base_instruction=supervisor.base_instruction,
                    extra_instructions=run.extra_instructions
                )

                async with AsyncSessionLocal() as session:
                    res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                    run = res.scalar_one()
                    # Record agent reasoning
                    session.add(RunActivity(
                        run_id=run_id,
                        activity_type="AGENT_REASONING",
                        title="Workflow Start Reasoning",
                        content=start_inference.thought_process,
                        metadata_json={"trigger": "WORKFLOW_START"}
                    ))
                    # Record tool actions
                    for tc in start_inference.tool_calls:
                        session.add(RunActivity(
                            run_id=run_id,
                            activity_type="TOOL_ACTION",
                            title=f"Action: {tc['name']}",
                            content=str(tc.get('args', {})),
                            metadata_json=tc
                        ))

                    # Update memory
                    new_mem = await MemoryManager.compact_memory(
                        previous_memory=run.compact_memory,
                        trigger="WORKFLOW_START",
                        event_info={},
                        actions_taken=start_inference.tool_calls,
                        current_state=run.current_state
                    )
                    run.compact_memory = new_mem
                    run.status = "SLEEPING"
                    sleep_secs = start_inference.next_sleep_seconds or supervisor.default_wakeup_interval_seconds
                    run.next_wakeup_at = datetime.now(timezone.utc) + timedelta(seconds=sleep_secs)
                    await session.commit()

            # 2. Main Event & Sleep Loop
            while True:
                async with AsyncSessionLocal() as session:
                    res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                    run = res.scalar_one_or_none()
                    if not run or run.status in ["COMPLETED", "TERMINATED"]:
                        break

                now = datetime.now(timezone.utc)
                sleep_remaining = max(1.0, (run.next_wakeup_at - now).total_seconds()) if run.next_wakeup_at else 60.0

                try:
                    # Wait for incoming signal or scheduled wakeup timeout
                    signal = await asyncio.wait_for(queue.get(), timeout=min(sleep_remaining, 300.0))
                except asyncio.TimeoutError:
                    # Scheduled timer elapsed -> Trigger: Scheduled Wakeup
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                        run = res.scalar_one_or_none()
                        if not run or run.status in ["COMPLETED", "TERMINATED", "PAUSED"]:
                            continue
                        run.status = "RUNNING"
                        session.add(RunActivity(
                            run_id=run_id,
                            activity_type="WORKFLOW_STATE_CHANGE",
                            title="Scheduled Wakeup Triggered",
                            content="Wakeup timer elapsed. AI supervisor reviewing status.",
                            metadata_json={}
                        ))
                        await session.commit()

                    wake_inf = await AgentReasoner.infer(
                        order_id=run.order_id,
                        trigger="SCHEDULED_WAKEUP",
                        event_info={"reason": "Routine scheduled check"},
                        compact_memory=run.compact_memory,
                        current_state=run.current_state,
                        base_instruction=supervisor.base_instruction,
                        extra_instructions=run.extra_instructions
                    )

                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                        run = res.scalar_one()
                        session.add(RunActivity(
                            run_id=run_id,
                            activity_type="AGENT_REASONING",
                            title="Scheduled Wakeup Reasoning",
                            content=wake_inf.thought_process,
                            metadata_json={"trigger": "SCHEDULED_WAKEUP"}
                        ))
                        for tc in wake_inf.tool_calls:
                            session.add(RunActivity(
                                run_id=run_id,
                                activity_type="TOOL_ACTION",
                                title=f"Action: {tc['name']}",
                                content=str(tc.get('args', {})),
                                metadata_json=tc
                            ))
                        run.compact_memory = await MemoryManager.compact_memory(
                            previous_memory=run.compact_memory,
                            trigger="SCHEDULED_WAKEUP",
                            event_info={},
                            actions_taken=wake_inf.tool_calls,
                            current_state=run.current_state
                        )
                        run.status = "SLEEPING"
                        sleep_secs = wake_inf.next_sleep_seconds or supervisor.default_wakeup_interval_seconds
                        run.next_wakeup_at = datetime.now(timezone.utc) + timedelta(seconds=sleep_secs)
                        await session.commit()
                    continue

                # Process Signal
                sig_type = signal.get("type")
                sig_data = signal.get("data", {})

                if sig_type == "PAUSE":
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                        run = res.scalar_one()
                        run.status = "PAUSED"
                        await session.commit()

                elif sig_type == "RESUME":
                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                        run = res.scalar_one()
                        run.status = "SLEEPING"
                        await session.commit()

                elif sig_type == "INSTRUCTION":
                    pass

                elif sig_type == "TERMINATE":
                    reason = sig_data.get("reason", "Manual termination")
                    await RunService._finalize_run(run_id, supervisor, reason, "TERMINATED")
                    break

                elif sig_type == "EVENT":
                    event_type = sig_data.get("event_type")
                    payload = sig_data.get("payload", {})
                    desc = sig_data.get("description", "")

                    async with AsyncSessionLocal() as session:
                        res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                        run = res.scalar_one()

                    # Terminal event check
                    if event_type in ["delivered", "order_cancelled", "refund_processed"]:
                        await RunService._finalize_run(run_id, supervisor, f"Terminal event '{event_type}' received.", "COMPLETED")
                        break

                    # Lightweight Classifier Check
                    should_wake, reason = await EventClassifier.evaluate_wake(
                        event_type=event_type,
                        payload=payload,
                        aggressiveness=supervisor.aggressiveness,
                        extra_instructions=run.extra_instructions
                    )

                    async with AsyncSessionLocal() as session:
                        session.add(RunActivity(
                            run_id=run_id,
                            activity_type="WAKE_DECISION",
                            title=f"Classifier: {'WAKE' if should_wake else 'SLEEP'}",
                            content=reason,
                            metadata_json={"should_wake": should_wake, "reason": reason}
                        ))
                        await session.commit()

                    if should_wake:
                        async with AsyncSessionLocal() as session:
                            res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                            run = res.scalar_one()
                            run.status = "RUNNING"
                            await session.commit()

                        inf = await AgentReasoner.infer(
                            order_id=run.order_id,
                            trigger="EVENT_SIGNAL",
                            event_info={"event_type": event_type, "payload": payload},
                            compact_memory=run.compact_memory,
                            current_state=run.current_state,
                            base_instruction=supervisor.base_instruction,
                            extra_instructions=run.extra_instructions
                        )

                        async with AsyncSessionLocal() as session:
                            res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
                            run = res.scalar_one()
                            session.add(RunActivity(
                                run_id=run_id,
                                activity_type="AGENT_REASONING",
                                title=f"Reasoning on {event_type}",
                                content=inf.thought_process,
                                metadata_json={"trigger": "EVENT_SIGNAL"}
                            ))
                            for tc in inf.tool_calls:
                                session.add(RunActivity(
                                    run_id=run_id,
                                    activity_type="TOOL_ACTION",
                                    title=f"Action: {tc['name']}",
                                    content=str(tc.get('args', {})),
                                    metadata_json=tc
                                ))
                            run.compact_memory = await MemoryManager.compact_memory(
                                previous_memory=run.compact_memory,
                                trigger="EVENT_SIGNAL",
                                event_info={"event_type": event_type},
                                actions_taken=inf.tool_calls,
                                current_state=run.current_state
                            )
                            if run.status != "COMPLETED" and run.status != "TERMINATED":
                                run.status = "SLEEPING"
                            sleep_secs = inf.next_sleep_seconds or supervisor.default_wakeup_interval_seconds
                            run.next_wakeup_at = datetime.now(timezone.utc) + timedelta(seconds=sleep_secs)
                            await session.commit()

        except Exception as e:
            print(f"[ERROR] Workflow runtime exception: {e}")

    @staticmethod
    async def _finalize_run(run_id: str, supervisor: Supervisor, reason: str, final_status: str):
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(OrderRun).where(OrderRun.id == run_id))
            run = res.scalar_one()
            act_res = await session.execute(select(RunActivity).where(RunActivity.run_id == run_id))
            activities = act_res.scalars().all()

            act_dicts = [{"type": a.activity_type, "title": a.title, "content": a.content} for a in activities]

            # Generate retrospective
            retro = await MemoryManager.generate_retrospective(
                order_id=run.order_id,
                compact_memory=run.compact_memory,
                activities=act_dicts,
                supervisor_name=supervisor.name,
                base_instruction=supervisor.base_instruction,
                termination_reason=reason
            )

            run.final_summary = retro["final_summary"]
            run.learnings = retro["learnings"]
            run.recommendations = retro["recommendations"]
            run.status = final_status
            run.completed_at = datetime.now(timezone.utc)

            session.add(RunActivity(
                run_id=run_id,
                activity_type="FINAL_RETROSPECTIVE",
                title="End-of-Run Retrospective Generated",
                content=f"Summary: {run.final_summary}",
                metadata_json=retro
            ))
            await session.commit()

    @staticmethod
    async def send_event_signal(db: AsyncSession, run_id: str, event_type: str, payload: dict, description: str = ""):
        run = await RunService._get_run_or_404(db, run_id)

        # 1. Immediately log the signal to DB for instantaneous UI feedback
        act = RunActivity(
            run_id=run_id,
            activity_type="SIGNAL_RECEIVED",
            title=f"Signal: {event_type}",
            content=description or str(payload),
            metadata_json={"event_type": event_type, "payload": payload}
        )
        db.add(act)

        # 2. Immediately update state from signal payload
        updated_state = dict(run.current_state or {})
        if "tracking_id" in payload:
            updated_state["tracking_id"] = payload["tracking_id"]
        if "carrier" in payload:
            updated_state["carrier"] = payload["carrier"]
        if event_type == "payment_confirmed":
            updated_state["payment_status"] = "confirmed"
        elif event_type == "payment_failed":
            updated_state["payment_status"] = "failed"
        elif event_type == "shipment_created":
            updated_state["logistics_status"] = "shipped"
        elif event_type == "shipment_delayed":
            updated_state["logistics_status"] = "delayed"
        elif event_type == "delivered":
            updated_state["delivery_status"] = "delivered"
            run.status = "COMPLETED"
            run.completed_at = datetime.now(timezone.utc)
        elif event_type in ["order_cancelled", "refund_processed"]:
            run.status = "COMPLETED"
            run.completed_at = datetime.now(timezone.utc)

        run.current_state = updated_state
        await db.commit()

        # 3. Dispatch to Temporal cluster or local async engine
        try:
            client = await TemporalClientManager.get_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal("signal_event", event_type, payload, description)
            return {"status": "signal_dispatched_temporal", "event_type": event_type}
        except Exception:
            queue = RunService._ensure_local_workflow(run_id, is_brand_new=False)
            await queue.put({"type": "EVENT", "data": {"event_type": event_type, "payload": payload, "description": description}})
            return {"status": "signal_queued_local", "event_type": event_type}

    @staticmethod
    async def send_instruction(db: AsyncSession, run_id: str, instruction: str):
        run = await RunService._get_run_or_404(db, run_id)
        run.extra_instructions = (run.extra_instructions + "\n" + instruction).strip()

        act = RunActivity(
            run_id=run_id,
            activity_type="INSTRUCTION_ADDED",
            title="Human Guidance Injected",
            content=instruction,
            metadata_json={"instruction": instruction}
        )
        db.add(act)
        await db.commit()

        try:
            client = await TemporalClientManager.get_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal("signal_instruction", instruction)
            return {"status": "instruction_injected_temporal"}
        except Exception:
            queue = RunService._ensure_local_workflow(run_id, is_brand_new=False)
            await queue.put({"type": "INSTRUCTION", "data": {"instruction": instruction}})
            return {"status": "instruction_injected_local"}

    @staticmethod
    async def pause_run(db: AsyncSession, run_id: str):
        run = await RunService._get_run_or_404(db, run_id)
        run.status = "PAUSED"
        act = RunActivity(
            run_id=run_id,
            activity_type="WORKFLOW_STATE_CHANGE",
            title="Workflow Paused",
            content="Operator paused execution.",
            metadata_json={}
        )
        db.add(act)
        await db.commit()

        try:
            client = await TemporalClientManager.get_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal("signal_pause")
            return {"status": "paused_temporal"}
        except Exception:
            queue = RunService._ensure_local_workflow(run_id, is_brand_new=False)
            await queue.put({"type": "PAUSE", "data": {}})
            return {"status": "paused_local"}

    @staticmethod
    async def resume_run(db: AsyncSession, run_id: str):
        run = await RunService._get_run_or_404(db, run_id)
        run.status = "SLEEPING"
        act = RunActivity(
            run_id=run_id,
            activity_type="WORKFLOW_STATE_CHANGE",
            title="Workflow Resumed",
            content="Operator resumed execution.",
            metadata_json={}
        )
        db.add(act)
        await db.commit()

        try:
            client = await TemporalClientManager.get_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal("signal_resume")
            return {"status": "resumed_temporal"}
        except Exception:
            queue = RunService._ensure_local_workflow(run_id, is_brand_new=False)
            await queue.put({"type": "RESUME", "data": {}})
            return {"status": "resumed_local"}

    @staticmethod
    async def terminate_run(db: AsyncSession, run_id: str, reason: str = "Manual termination"):
        run = await RunService._get_run_or_404(db, run_id)
        run.status = "TERMINATED"
        run.completed_at = datetime.now(timezone.utc)
        act = RunActivity(
            run_id=run_id,
            activity_type="WORKFLOW_STATE_CHANGE",
            title="Workflow Terminated",
            content=f"Reason: {reason}",
            metadata_json={"reason": reason}
        )
        db.add(act)
        await db.commit()

        try:
            client = await TemporalClientManager.get_client()
            handle = client.get_workflow_handle(run.temporal_workflow_id)
            await handle.signal("signal_terminate", reason)
            return {"status": "terminated_temporal"}
        except Exception:
            queue = RunService._ensure_local_workflow(run_id, is_brand_new=False)
            await queue.put({"type": "TERMINATE", "data": {"reason": reason}})
            return {"status": "terminated_local"}

    @staticmethod
    async def list_runs(
        db: AsyncSession,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[OrderRun]:
        stmt = select(OrderRun).options(selectinload(OrderRun.supervisor)).order_by(desc(OrderRun.created_at))
        if status:
            stmt = stmt.where(OrderRun.status == status)
        stmt = stmt.offset(offset).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def get_run_detail(db: AsyncSession, run_id: str) -> OrderRun:
        return await RunService._get_run_or_404(db, run_id)

    @staticmethod
    async def _get_run_or_404(db: AsyncSession, run_id: str) -> OrderRun:
        stmt = (
            select(OrderRun)
            .options(selectinload(OrderRun.supervisor), selectinload(OrderRun.activities))
            .where(OrderRun.id == run_id)
        )
        res = await db.execute(stmt)
        run = res.scalar_one_or_none()
        if not run:
            raise HTTPException(status_code=404, detail="Order run not found")

        return run
