import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


class OrderRun(Base):
    __tablename__ = "order_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(100), nullable=False, index=True)
    supervisor_id = Column(String(36), ForeignKey("supervisors.id", ondelete="SET NULL"), nullable=True)
    temporal_workflow_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Status: INITIALIZING, RUNNING, SLEEPING, PAUSED, COMPLETED, TERMINATED
    status = Column(String(50), default="INITIALIZING", nullable=False, index=True)
    
    # Memory and State
    compact_memory = Column(Text, default="", nullable=False)
    current_state = Column(JSON, default=dict, nullable=False)
    extra_instructions = Column(Text, default="", nullable=False)
    next_wakeup_at = Column(DateTime(timezone=True), nullable=True)

    # Final Retrospective Outputs
    final_summary = Column(Text, nullable=True)
    learnings = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    supervisor = relationship("Supervisor", back_populates="runs")
    activities = relationship(
        "RunActivity",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="RunActivity.created_at"
    )
