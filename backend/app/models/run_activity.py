import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


class RunActivity(Base):
    """
    Unified activity and audit log for a workflow run.
    Stores events received, classifier decisions, agent reasoning,
    tool actions executed, manual instructions, and workflow status changes.
    """
    __tablename__ = "run_activities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("order_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Types: SIGNAL_RECEIVED, WAKE_DECISION, AGENT_REASONING, TOOL_ACTION, INSTRUCTION_ADDED, WORKFLOW_STATE_CHANGE, FINAL_RETROSPECTIVE
    activity_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="", nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    run = relationship("OrderRun", back_populates="activities")
