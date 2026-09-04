"""
FlowPilot End-to-End Simulation Script
Demonstrates the full order supervisor lifecycle directly against the database and agent engine.
"""
import asyncio
from backend.app.db.init_db import init_db
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.supervisor import Supervisor
from backend.app.models.order_run import OrderRun
from backend.app.models.run_activity import RunActivity
from backend.app.agent.classifier import EventClassifier
from backend.app.agent.reasoner import AgentReasoner
from backend.app.agent.memory import MemoryManager
from sqlalchemy import select


async def run_simulation():
    print("=" * 70)
    print("[SIMULATION] FLOWPILOT - END-TO-END SUPERVISOR SIMULATION")
    print("=" * 70)

    # 1. Initialize DB
    await init_db()

    async with AsyncSessionLocal() as session:
        # 2. Fetch Guardian template
        res = await session.execute(select(Supervisor).limit(1))
        supervisor = res.scalar_one()
        print(f"\n[1] Supervisor Selected: '{supervisor.name}' ({supervisor.aggressiveness} aggressiveness)")

        # 3. Create simulated order
        order_id = "ORD-SIM-99201"
        order_run = OrderRun(
            order_id=order_id,
            supervisor_id=supervisor.id,
            temporal_workflow_id=f"flowpilot-{order_id}",
            status="RUNNING",
            compact_memory=f"Order #{order_id} initialized. Customer: Maya Lin, Item: Studio Headphones ($249.99).",
            current_state={"item": "Studio Headphones", "amount": 249.99, "customer_name": "Maya Lin"},
            extra_instructions="VIP Customer tier."
        )
        session.add(order_run)
        await session.commit()
        await session.refresh(order_run)
        print(f"[2] Order Run Created: {order_run.id} for Order #{order_id}")

        # 4. Trigger 1: Workflow Start Reasoning
        print("\n[3] Trigger 1: Workflow Start Reasoning...")
        start_inference = await AgentReasoner.infer(
            order_id=order_id,
            trigger="WORKFLOW_START",
            event_info={"order_details": order_run.current_state},
            compact_memory=order_run.compact_memory,
            current_state=order_run.current_state,
            base_instruction=supervisor.base_instruction,
            extra_instructions=order_run.extra_instructions
        )
        print(f"    Agent Thought: {start_inference.thought_process}")
        print(f"    Tools Executed: {[t['name'] for t in start_inference.tool_calls]}")
        print(f"    Next Sleep Duration: {start_inference.next_sleep_seconds} seconds")

        # 5. Trigger 2: Incoming Exception Signal (payment_failed)
        print("\n[4] Incoming Signal: 'payment_failed'...")
        event_type = "payment_failed"
        payload = {"reason": "Card zip code mismatch", "attempt": 1}

        # Classifier check
        should_wake, reason = await EventClassifier.evaluate_wake(
            event_type=event_type,
            payload=payload,
            aggressiveness=supervisor.aggressiveness,
            extra_instructions=order_run.extra_instructions
        )
        print(f"    Classifier Decision: {'WAKE' if should_wake else 'SLEEP'} ({reason})")

        if should_wake:
            agent_res = await AgentReasoner.infer(
                order_id=order_id,
                trigger="EVENT_SIGNAL",
                event_info={"event_type": event_type, "payload": payload},
                compact_memory=order_run.compact_memory,
                current_state=order_run.current_state,
                base_instruction=supervisor.base_instruction,
                extra_instructions=order_run.extra_instructions
            )
            print(f"    Agent Thought: {agent_res.thought_process}")
            for tc in agent_res.tool_calls:
                print(f"    -> Executed Tool [{tc['name']}]: {tc['args']}")

            # Update memory
            new_memory = await MemoryManager.compact_memory(
                previous_memory=order_run.compact_memory,
                trigger="EVENT_SIGNAL",
                event_info={"event_type": event_type},
                actions_taken=agent_res.tool_calls,
                current_state=order_run.current_state
            )
            order_run.compact_memory = new_memory
            print(f"    Updated Compact Memory: {new_memory}")

        # 6. Trigger 3: Delivered (Terminal Event) -> Retrospective
        print("\n[5] Incoming Terminal Event: 'delivered'...")
        retro = await MemoryManager.generate_retrospective(
            order_id=order_id,
            compact_memory=order_run.compact_memory,
            activities=[{"type": "TOOL_ACTION", "title": "message_payments_team", "content": "Alerted payments team"}],
            supervisor_name=supervisor.name,
            base_instruction=supervisor.base_instruction,
            termination_reason="Carrier confirmed delivery."
        )
        order_run.final_summary = retro["final_summary"]
        order_run.learnings = retro["learnings"]
        order_run.recommendations = retro["recommendations"]
        order_run.status = "COMPLETED"
        await session.commit()

        print("\n" + "=" * 70)
        print("[REPORT] SIMULATION COMPLETE: RETROSPECTIVE REPORT")
        print("=" * 70)
        print(f"FINAL SUMMARY:\n{order_run.final_summary}\n")
        print(f"KEY LEARNINGS:\n{order_run.learnings}\n")
        print(f"RECOMMENDATIONS:\n{order_run.recommendations}\n")


if __name__ == "__main__":
    asyncio.run(run_simulation())
