import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

from backend.app.core.config import settings
from backend.app.temporal.workflows import OrderSupervisorWorkflow
from backend.app.temporal.activities import (
    classify_event_activity,
    record_signal_activity,
    record_instruction_activity,
    sync_workflow_status_activity,
    run_agent_reasoning_activity,
    generate_final_report_activity,
)


async def run_worker():
    print(f"[WORKER] Connecting to Temporal server at {settings.TEMPORAL_HOST} (Namespace: {settings.TEMPORAL_NAMESPACE})...")
    client = await Client.connect(
        settings.TEMPORAL_HOST,
        namespace=settings.TEMPORAL_NAMESPACE
    )
    print(f"[WORKER] Connected successfully! Starting worker on task queue: '{settings.TEMPORAL_TASK_QUEUE}'...")

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=[OrderSupervisorWorkflow],
        activities=[
            classify_event_activity,
            record_signal_activity,
            record_instruction_activity,
            sync_workflow_status_activity,
            run_agent_reasoning_activity,
            generate_final_report_activity,
        ]
    )

    print("[WORKER] Worker is ready and listening for workflows and activities. Press Ctrl+C to stop.")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(run_worker())
