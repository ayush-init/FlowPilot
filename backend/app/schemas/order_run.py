from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.supervisor import SupervisorResponse
from backend.app.schemas.activity import RunActivityResponse


class OrderRunCreate(BaseModel):
    order_id: str = Field(..., example="ORD-84920", min_length=1, max_length=100)
    supervisor_id: Optional[str] = Field(default=None, description="Supervisor template ID. If omitted, uses default guardian.")
    order_details: Dict[str, Any] = Field(
        default_factory=lambda: {
            "customer_name": "Alice Johnson",
            "customer_email": "alice@example.com",
            "item": "Mechanical Keyboard Pro",
            "amount": 189.99,
            "currency": "USD",
            "shipping_address": "742 Evergreen Terrace, Springfield, OR",
            "priority": "standard"
        },
        description="Initial order payload"
    )
    initial_instructions: Optional[str] = Field(
        default=None,
        example="Customer is a VIP loyalty tier member. Keep proactive updates frequent."
    )


class EventSignalInput(BaseModel):
    event_type: str = Field(
        ...,
        example="shipment_delayed",
        description="Event name: order_created, payment_confirmed, payment_failed, shipment_created, shipment_delayed, delivered, refund_requested, customer_message_received, no_update_for_n_hours"
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        example={"reason": "Severe weather in carrier hub", "expected_delay_days": 2, "tracking_id": "TRK-99214"}
    )
    description: Optional[str] = Field(default=None, example="Logistics carrier reported a 48h delay due to blizzard.")


class InstructionInput(BaseModel):
    instruction: str = Field(
        ...,
        min_length=1,
        example="If shipment is delayed past 24 hours, automatically offer a $20 gift voucher and notify customer."
    )


class WorkflowControlInput(BaseModel):
    reason: Optional[str] = Field(default="Manual user action", example="Operator requested termination.")


class OrderRunResponse(BaseModel):
    id: str
    order_id: str
    supervisor_id: Optional[str]
    supervisor: Optional[SupervisorResponse] = None
    temporal_workflow_id: str
    status: str
    compact_memory: str
    current_state: Dict[str, Any]
    extra_instructions: str
    next_wakeup_at: Optional[datetime] = None
    final_summary: Optional[str] = None
    learnings: Optional[str] = None
    recommendations: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class OrderRunDetailResponse(OrderRunResponse):
    activities: List[RunActivityResponse] = Field(default_factory=list)
