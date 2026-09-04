from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


class RunActivityBase(BaseModel):
    activity_type: str = Field(
        ...,
        example="TOOL_ACTION",
        description="SIGNAL_RECEIVED, WAKE_DECISION, AGENT_REASONING, TOOL_ACTION, INSTRUCTION_ADDED, WORKFLOW_STATE_CHANGE, FINAL_RETROSPECTIVE"
    )
    title: str = Field(..., example="Executed: message_logistics_team")
    content: str = Field(default="", example="Requested delay investigation with FedEx tracking #TRK-10928")
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class RunActivityCreate(RunActivityBase):
    run_id: str


class RunActivityResponse(RunActivityBase):
    id: str
    run_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
