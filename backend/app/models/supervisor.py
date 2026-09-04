import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


class Supervisor(Base):
    __tablename__ = "supervisors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    base_instruction = Column(Text, nullable=False)
    model = Column(String(100), default="gemini-1.5-flash", nullable=False)
    aggressiveness = Column(String(50), default="balanced", nullable=False)  # low, balanced, high
    default_wakeup_interval_seconds = Column(Integer, default=7200, nullable=False)  # 2 hours
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    runs = relationship("OrderRun", back_populates="supervisor", cascade="all, delete-orphan")
