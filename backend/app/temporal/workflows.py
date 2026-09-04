from datetime import timedelta
from typing import Dict, Any, List, Optional
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from backend.app.temporal.activities import (
        classify_event_activity,
        record_signal_activity,
        record_instruction_activity,
        sync_workflow_status_activity,
        run_agent_reasoning_activity,
        generate_final_report_activity,
    )


@workflow.defn
class OrderSupervisorWorkflow:
    """
    Long-running Temporal Workflow overseeing a single order from creation to terminal completion.
    Supports 3 triggers for agent inference:
      1. Workflow start
      2. Incoming event signal (filtered by lightweight classifier)
      3. Scheduled wake-up timer
    """

    def __init__(self):
        self.run_id: str = ""
        self.order_id: str = ""
        self.status: str = "INITIALIZING"
        self.pending_events: List[Dict[str, Any]] = []
        self.pending_instructions: List[str] = []
        self.is_paused: bool = False
        self.is_terminated: bool = False
        self.termination_reason: Optional[str] = None
        self.is_order_completed: bool = False
        self.sleep_seconds: int = 7200
        self.aggressiveness: str = "balanced"

    @workflow.signal
    async def signal_event(self, event_data: Dict[str, Any]) -> None:
        """Signal handler for incoming order events."""
        self.pending_events.append(event_data)

    @workflow.signal
    async def signal_instruction(self, instruction: str) -> None:
        """Signal handler for live operator instructions."""
        self.pending_instructions.append(instruction)

    @workflow.signal
    async def signal_pause(self) -> None:
        """Signal handler to pause the supervisor."""
        self.is_paused = True

    @workflow.signal
    async def signal_resume(self) -> None:
        """Signal handler to resume the supervisor."""
        self.is_paused = False

    @workflow.signal
    async def signal_terminate(self, reason: str = "Manual operator termination") -> None:
        """Signal handler to terminate the workflow immediately."""
        self.is_terminated = True
        self.termination_reason = reason

    @workflow.query
    def get_status(self) -> Dict[str, Any]:
        """Query workflow state in real-time."""
        return {
            "status": self.status,
            "is_paused": self.is_paused,
            "is_terminated": self.is_terminated,
            "is_order_completed": self.is_order_completed,
            "pending_events_count": len(self.pending_events),
            "pending_instructions_count": len(self.pending_instructions),
            "sleep_seconds": self.sleep_seconds
        }

    @workflow.run
    async def run(self, input_params: Dict[str, Any]) -> Dict[str, Any]:
        self.run_id = input_params["run_id"]
        self.order_id = input_params["order_id"]
        self.aggressiveness = input_params.get("aggressiveness", "balanced")
        self.sleep_seconds = input_params.get("default_wakeup_interval_seconds", 7200)

        # 1. Start Workflow: Update status to RUNNING in database
        self.status = "RUNNING"
        await workflow.execute_activity(
            sync_workflow_status_activity,
            {"run_id": self.run_id, "status": "RUNNING"},
            start_to_close_timeout=timedelta(seconds=15)
        )

        # 2. Trigger 1: Workflow Start Agent Reasoning
        initial_result = await workflow.execute_activity(
            run_agent_reasoning_activity,
            {
                "run_id": self.run_id,
                "trigger": "WORKFLOW_START",
                "event_info": {"order_details": input_params.get("order_details", {})}
            },
            start_to_close_timeout=timedelta(seconds=60)
        )
        self.sleep_seconds = initial_result.get("next_sleep_seconds", self.sleep_seconds)

        # 3. Main Event-Driven Sleep / Wake Loop
        while not self.is_terminated and not self.is_order_completed:
            # Check Pause State
            if self.is_paused:
                self.status = "PAUSED"
                await workflow.execute_activity(
                    sync_workflow_status_activity,
                    {"run_id": self.run_id, "status": "PAUSED"},
                    start_to_close_timeout=timedelta(seconds=15)
                )
                await workflow.wait_condition(
                    lambda: (not self.is_paused) or self.is_terminated
                )
                if self.is_terminated:
                    break
                self.status = "RUNNING"
                await workflow.execute_activity(
                    sync_workflow_status_activity,
                    {"run_id": self.run_id, "status": "RUNNING"},
                    start_to_close_timeout=timedelta(seconds=15)
                )

            # Transition to SLEEPING
            self.status = "SLEEPING"
            await workflow.execute_activity(
                sync_workflow_status_activity,
                {
                    "run_id": self.run_id,
                    "status": "SLEEPING",
                    "next_wakeup_seconds": self.sleep_seconds
                },
                start_to_close_timeout=timedelta(seconds=15)
            )

            # Durable Sleep: Wait for scheduled timer or early wake signal
            woken_by_signal = False
            try:
                await workflow.wait_condition(
                    lambda: bool(self.pending_events or self.pending_instructions or self.is_paused or self.is_terminated),
                    timeout=timedelta(seconds=self.sleep_seconds)
                )
                woken_by_signal = True
            except TimeoutError:
                woken_by_signal = False

            # Check termination
            if self.is_terminated:
                break

            # Handle Injected Human Instructions
            if self.pending_instructions:
                instruction = self.pending_instructions.pop(0)
                await workflow.execute_activity(
                    record_instruction_activity,
                    {"run_id": self.run_id, "instruction": instruction},
                    start_to_close_timeout=timedelta(seconds=15)
                )

                self.status = "RUNNING"
                await workflow.execute_activity(
                    sync_workflow_status_activity,
                    {"run_id": self.run_id, "status": "RUNNING"},
                    start_to_close_timeout=timedelta(seconds=15)
                )

                # Agent inference on manual instruction
                result = await workflow.execute_activity(
                    run_agent_reasoning_activity,
                    {
                        "run_id": self.run_id,
                        "trigger": "INSTRUCTION_INJECTED",
                        "event_info": {"instruction": instruction}
                    },
                    start_to_close_timeout=timedelta(seconds=60)
                )
                self.sleep_seconds = result.get("next_sleep_seconds", self.sleep_seconds)
                continue

            # Handle Incoming Event Signals
            if self.pending_events:
                event_data = self.pending_events.pop(0)
                event_type = event_data.get("event_type", "unknown")
                payload = event_data.get("payload", {})
                description = event_data.get("description", "")

                # Record signal in activity log & update state
                await workflow.execute_activity(
                    record_signal_activity,
                    {
                        "run_id": self.run_id,
                        "event_type": event_type,
                        "payload": payload,
                        "description": description
                    },
                    start_to_close_timeout=timedelta(seconds=15)
                )

                # Lightweight Classifier Check: Decide whether to wake the agent
                classifier_res = await workflow.execute_activity(
                    classify_event_activity,
                    {
                        "run_id": self.run_id,
                        "event_type": event_type,
                        "payload": payload,
                        "aggressiveness": self.aggressiveness
                    },
                    start_to_close_timeout=timedelta(seconds=20)
                )

                if classifier_res.get("should_wake", True):
                    self.status = "RUNNING"
                    await workflow.execute_activity(
                        sync_workflow_status_activity,
                        {"run_id": self.run_id, "status": "RUNNING"},
                        start_to_close_timeout=timedelta(seconds=15)
                    )

                    # Trigger 2: Signal Agent Inference
                    agent_res = await workflow.execute_activity(
                        run_agent_reasoning_activity,
                        {
                            "run_id": self.run_id,
                            "trigger": "EVENT_SIGNAL",
                            "event_info": event_data
                        },
                        start_to_close_timeout=timedelta(seconds=60)
                    )
                    self.sleep_seconds = agent_res.get("next_sleep_seconds", self.sleep_seconds)

                    # Lifecycle Rule: Terminal events complete the workflow
                    if event_type.lower() in ["delivered", "refund_completed", "cancelled"]:
                        self.is_order_completed = True
                        break
                else:
                    # Stays asleep until next loop / wakeup
                    continue

            # Trigger 3: Scheduled Wake-up Timer
            elif not woken_by_signal:
                self.status = "RUNNING"
                await workflow.execute_activity(
                    sync_workflow_status_activity,
                    {"run_id": self.run_id, "status": "RUNNING"},
                    start_to_close_timeout=timedelta(seconds=15)
                )

                timer_res = await workflow.execute_activity(
                    run_agent_reasoning_activity,
                    {
                        "run_id": self.run_id,
                        "trigger": "SCHEDULED_WAKEUP",
                        "event_info": {"reason": "Routine scheduled check-in"}
                    },
                    start_to_close_timeout=timedelta(seconds=60)
                )
                self.sleep_seconds = timer_res.get("next_sleep_seconds", self.sleep_seconds)

        # 4. Final Retrospective & Learnings Synthesis
        final_status = "TERMINATED" if self.is_terminated else "COMPLETED"
        reason = self.termination_reason if self.is_terminated else "Order completed successfully."

        final_report = await workflow.execute_activity(
            generate_final_report_activity,
            {
                "run_id": self.run_id,
                "reason": reason,
                "final_status": final_status
            },
            start_to_close_timeout=timedelta(seconds=60)
        )

        return final_report
