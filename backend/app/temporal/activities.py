import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from temporalio import activity
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.order_run import OrderRun
from backend.app.models.supervisor import Supervisor
from backend.app.models.run_activity import RunActivity
from backend.app.agent.classifier import EventClassifier
from backend.app.agent.reasoner import AgentReasoner
from backend.app.agent.memory import MemoryManager


@activity.defn
async def classify_event_activity(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lightweight classification activity to determine if an incoming signal warrants waking the agent.
    """
    run_id = params["run_id"]
    event_type = params["event_type"]
    payload = params.get("payload", {})
    aggressiveness = params.get("aggressiveness", "balanced")
    extra_instructions = params.get("extra_instructions", "")

    should_wake, reason = await EventClassifier.evaluate_wake(
        event_type=event_type,
        payload=payload,
        aggressiveness=aggressiveness,
        extra_instructions=extra_instructions
    )

    # Persist the wake/sleep decision in database activity log
    async with AsyncSessionLocal() as session:
        activity_record = RunActivity(
            run_id=run_id,
            activity_type="WAKE_DECISION",
            title=f"Wake Decision: {'WAKE' if should_wake else 'SLEEP'}",
            content=f"Event '{event_type}' -> Decision: {'Waking main agent' if should_wake else 'Workflow staying asleep'}. Reason: {reason}",
            metadata_json={"event_type": event_type, "should_wake": should_wake, "reason": reason}
        )
        session.add(activity_record)
        await session.commit()

    return {"should_wake": should_wake, "reason": reason}


@activity.defn
async def record_signal_activity(params: Dict[str, Any]) -> None:
    """
    Logs an incoming event signal into the database and updates current order state.
    """
    run_id = params["run_id"]
    event_type = params["event_type"]
    payload = params.get("payload", {})
    description = params.get("description", "")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrderRun).where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if run:
            # Update state dictionary
            state = dict(run.current_state or {})
            state["last_event"] = event_type
            state["last_event_time"] = datetime.now(timezone.utc).isoformat()
            state.update(payload)
            run.current_state = state

            activity_record = RunActivity(
                run_id=run_id,
                activity_type="SIGNAL_RECEIVED",
                title=f"Event Signal: {event_type}",
                content=description or f"Received signal '{event_type}' with payload: {json.dumps(payload)}",
                metadata_json={"event_type": event_type, "payload": payload}
            )
            session.add(activity_record)
            await session.commit()


@activity.defn
async def record_instruction_activity(params: Dict[str, Any]) -> None:
    """
    Appends mid-run human instruction to the run record and activity log.
    """
    run_id = params["run_id"]
    instruction = params["instruction"]

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrderRun).where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if run:
            current_instructions = run.extra_instructions or ""
            new_instructions = (current_instructions + "\n" + instruction).strip() if current_instructions else instruction
            run.extra_instructions = new_instructions

            activity_record = RunActivity(
                run_id=run_id,
                activity_type="INSTRUCTION_ADDED",
                title="Human Instruction Injected",
                content=instruction,
                metadata_json={"instruction": instruction}
            )
            session.add(activity_record)
            await session.commit()


@activity.defn
async def sync_workflow_status_activity(params: Dict[str, Any]) -> None:
    """
    Updates the run status and next wakeup timestamp in the database.
    """
    run_id = params["run_id"]
    status = params["status"]
    next_wakeup_seconds = params.get("next_wakeup_seconds")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrderRun).where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if run:
            run.status = status
            if next_wakeup_seconds:
                run.next_wakeup_at = datetime.now(timezone.utc) + timedelta(seconds=next_wakeup_seconds)
            elif status in ["RUNNING", "COMPLETED", "TERMINATED"]:
                run.next_wakeup_at = None

            activity_record = RunActivity(
                run_id=run_id,
                activity_type="WORKFLOW_STATE_CHANGE",
                title=f"Status -> {status}",
                content=f"Workflow transitioned to {status}." + (f" Scheduled wakeup in {next_wakeup_seconds}s." if next_wakeup_seconds else ""),
                metadata_json={"status": status, "next_wakeup_seconds": next_wakeup_seconds}
            )
            session.add(activity_record)
            await session.commit()


@activity.defn
async def run_agent_reasoning_activity(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a reasoning step with Gemini, records business tool actions in PostgreSQL,
    and updates compact memory.
    """
    run_id = params["run_id"]
    trigger = params.get("trigger", "WORKFLOW_START")
    event_info = params.get("event_info", {})

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrderRun).options(selectinload(OrderRun.supervisor)).where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            raise ValueError(f"OrderRun with ID {run_id} not found.")

        supervisor_name = run.supervisor.name if run.supervisor else "Standard Guardian"
        base_instruction = run.supervisor.base_instruction if run.supervisor else "Oversee order and ensure fulfillment."
        default_sleep = run.supervisor.default_wakeup_interval_seconds if run.supervisor else 7200

        # Execute Gemini Agent Inference
        inference = await AgentReasoner.infer(
            order_id=run.order_id,
            trigger=trigger,
            event_info=event_info,
            compact_memory=run.compact_memory or "",
            current_state=run.current_state or {},
            base_instruction=base_instruction,
            extra_instructions=run.extra_instructions or "",
            default_sleep_seconds=default_sleep
        )

        # Record Agent Reasoning thought process
        reasoning_record = RunActivity(
            run_id=run.id,
            activity_type="AGENT_REASONING",
            title=f"AI Reasoning ({trigger})",
            content=inference.thought_process,
            metadata_json={
                "trigger": trigger,
                "tool_calls_count": len(inference.tool_calls),
                "next_sleep_seconds": inference.next_sleep_seconds
            }
        )
        session.add(reasoning_record)

        # Record each Business Tool Action executed by the agent
        for tool_call in inference.tool_calls:
            action_name = tool_call["name"]
            action_args = tool_call["args"]

            # Human-readable summary
            if action_name == "message_fulfillment_team":
                summary = f"Fulfillment ({action_args.get('priority', 'medium')} priority): {action_args.get('message')}"
            elif action_name == "message_payments_team":
                summary = f"Payments ({action_args.get('issue_type')}, ${action_args.get('amount', 'N/A')}): {action_args.get('message')}"
            elif action_name == "message_logistics_team":
                summary = f"Logistics ({action_args.get('action_required')}): {action_args.get('message')}"
            elif action_name == "message_customer":
                summary = f"Customer Message [{action_args.get('subject')}]: {action_args.get('message')}"
            elif action_name == "create_internal_note":
                summary = f"Internal Note [{action_args.get('category')}]: {action_args.get('content')}"
            else:
                summary = json.dumps(action_args)

            action_record = RunActivity(
                run_id=run.id,
                activity_type="TOOL_ACTION",
                title=f"Action: {action_name}",
                content=summary,
                metadata_json={"tool_name": action_name, "arguments": action_args}
            )
            session.add(action_record)

        # Compact memory update
        updated_memory = await MemoryManager.compact_memory(
            previous_memory=run.compact_memory or "",
            trigger=trigger,
            event_info=event_info,
            actions_taken=inference.tool_calls,
            current_state=run.current_state or {}
        )
        run.compact_memory = updated_memory

        # Apply state updates
        current_state = dict(run.current_state or {})
        current_state.update(inference.state_updates)
        run.current_state = current_state

        await session.commit()

        return {
            "thought_process": inference.thought_process,
            "tool_calls": inference.tool_calls,
            "next_sleep_seconds": inference.next_sleep_seconds,
            "compact_memory": updated_memory
        }


@activity.defn
async def generate_final_report_activity(params: Dict[str, Any]) -> Dict[str, str]:
    """
    Synthesizes the end-of-run retrospective summary, key learnings, and recommendations.
    """
    run_id = params["run_id"]
    termination_reason = params.get("reason", "Terminal order state reached")
    final_status = params.get("final_status", "COMPLETED")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrderRun)
            .options(selectinload(OrderRun.supervisor), selectinload(OrderRun.activities))
            .where(OrderRun.id == run_id)
        )
        run = result.scalar_one_or_none()
        if not run:
            raise ValueError(f"OrderRun with ID {run_id} not found.")

        supervisor_name = run.supervisor.name if run.supervisor else "Standard Guardian"
        base_instruction = run.supervisor.base_instruction if run.supervisor else "Oversee order lifecycle."

        activities_data = [
            {
                "type": a.activity_type,
                "title": a.title,
                "content": a.content,
                "created_at": a.created_at.isoformat()
            } for a in run.activities
        ]

        retrospective = await MemoryManager.generate_retrospective(
            order_id=run.order_id,
            compact_memory=run.compact_memory or "",
            activities=activities_data,
            supervisor_name=supervisor_name,
            base_instruction=base_instruction,
            termination_reason=termination_reason
        )

        run.final_summary = retrospective["final_summary"]
        run.learnings = retrospective["learnings"]
        run.recommendations = retrospective["recommendations"]
        run.status = final_status
        run.next_wakeup_at = None
        run.completed_at = datetime.now(timezone.utc)

        final_activity = RunActivity(
            run_id=run.id,
            activity_type="FINAL_RETROSPECTIVE",
            title="Workflow Retrospective Generated",
            content=retrospective["final_summary"],
            metadata_json=retrospective
        )
        session.add(final_activity)
        await session.commit()

        return retrospective
