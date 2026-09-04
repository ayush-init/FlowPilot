from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.order_run import EventSignalInput
from backend.app.services.run_service import RunService

router = APIRouter(prefix="/simulator", tags=["Event Simulator"])

EVENT_TEMPLATES = [
    {
        "event_type": "payment_confirmed",
        "category": "Payments",
        "description": "Payment successfully processed by payment gateway.",
        "payload": {"transaction_id": "TXN-884920", "status": "settled", "amount": 189.99}
    },
    {
        "event_type": "payment_failed",
        "category": "Payments",
        "description": "Credit card declined due to invalid billing zip code or insufficient funds.",
        "payload": {"error_code": "card_declined", "reason": "Insufficient funds", "attempts": 2}
    },
    {
        "event_type": "shipment_created",
        "category": "Logistics",
        "description": "Warehouse created shipping label and packed order.",
        "payload": {"tracking_id": "TRK-FEDEX-99214", "carrier": "FedEx Ground", "origin": "Memphis, TN"}
    },
    {
        "event_type": "shipment_delayed",
        "category": "Logistics",
        "description": "Carrier reported a transit delay due to severe snowstorm.",
        "payload": {"reason": "Winter storm in Midwest sorting hub", "expected_delay_hours": 48, "tracking_id": "TRK-FEDEX-99214"}
    },
    {
        "event_type": "delivered",
        "category": "Lifecycle (Terminal)",
        "description": "Carrier confirmed successful porch delivery to customer.",
        "payload": {"delivery_timestamp": "2026-09-04T14:30:00Z", "signed_by": "Front Door", "tracking_id": "TRK-FEDEX-99214"}
    },
    {
        "event_type": "refund_requested",
        "category": "Payments / Support",
        "description": "Customer requested full refund via web self-service portal.",
        "payload": {"reason": "Ordered wrong size/item", "requested_amount": 189.99}
    },
    {
        "event_type": "customer_message_received",
        "category": "Customer",
        "description": "Customer sent an inquiry regarding estimated delivery date.",
        "payload": {"message": "Hi, I have not received any shipping updates. When will my package arrive?", "channel": "email"}
    },
    {
        "event_type": "no_update_for_n_hours",
        "category": "Monitoring",
        "description": "Carrier tracking has not moved for 36 hours.",
        "payload": {"hours_since_last_scan": 36, "last_location": "Indianapolis Hub"}
    }
]


class ScenarioStep(BaseModel):
    event_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    description: Optional[str] = None


class BatchScenarioRequest(BaseModel):
    run_id: str
    scenario_name: str = Field(..., example="Severe Weather Delay Recovery")
    events: List[ScenarioStep]


@router.get("/events")
async def get_event_templates():
    """Retrieve pre-configured order lifecycle event templates."""
    return {"templates": EVENT_TEMPLATES}


@router.post("/batch-scenario")
async def execute_batch_scenario(
    scenario_in: BatchScenarioRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute a sequence of simulated events into a running order supervisor workflow.
    """
    results = []
    for step in scenario_in.events:
        signal_input = EventSignalInput(
            event_type=step.event_type,
            payload=step.payload,
            description=step.description
        )
        res = await RunService.send_event_signal(db, scenario_in.run_id, signal_input)
        results.append(res)

    return {
        "scenario": scenario_in.scenario_name,
        "run_id": scenario_in.run_id,
        "dispatched_events_count": len(results),
        "results": results
    }
