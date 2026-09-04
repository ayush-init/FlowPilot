from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class SupervisorBase(BaseModel):
    name: str = Field(..., example="Standard E-Commerce Guardian", min_length=1, max_length=255)
    base_instruction: str = Field(
        ...,
        example="You are a proactive order supervisor. Ensure customer orders are fulfilled smoothly. Intervene only when blockers occur."
    )
    model: str = Field(default="gemini-1.5-flash", example="gemini-1.5-flash")
    aggressiveness: Literal["low", "balanced", "high"] = Field(
        default="balanced",
        description="Controls event classifier sensitivity: 'low' sleeps more, 'high' wakes on minor signals."
    )
    default_wakeup_interval_seconds: int = Field(
        default=7200,
        ge=60,
        description="Default scheduled sleep duration in seconds (e.g., 7200 for 2 hours)."
    )


class SupervisorCreate(SupervisorBase):
    pass


class SupervisorUpdate(BaseModel):
    name: Optional[str] = None
    base_instruction: Optional[str] = None
    model: Optional[str] = None
    aggressiveness: Optional[Literal["low", "balanced", "high"]] = None
    default_wakeup_interval_seconds: Optional[int] = None


class SupervisorResponse(SupervisorBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
