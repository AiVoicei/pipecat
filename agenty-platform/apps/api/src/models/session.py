"""
Agent Session database model for runtime tracking
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel


class AgentSession(BaseModel):
    """Agent session model for tracking agent runtime instances"""
    __tablename__ = "agent_sessions"

    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    session_uuid = Column(String(255), unique=True, nullable=False, index=True)  # Public session ID

    # Session status: starting, running, paused, completed, error, terminated
    status = Column(String(50), default="starting", nullable=False)

    # Session timing
    started_at = Column(DateTime, default=func.now(), nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)

    # Session metadata and statistics
    total_messages = Column(Integer, default=0, nullable=False)
    total_audio_duration = Column(Integer, default=0, nullable=False)  # seconds
    total_tokens_used = Column(Integer, default=0, nullable=False)

    # Error tracking
    error_count = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)
    last_error_at = Column(DateTime, nullable=True)

    # Session configuration (snapshot of agent config at session start)
    session_config = Column(JSON, default={}, nullable=False)

    # Connection and transport info
    transport_type = Column(String(50), nullable=True)  # webrtc, websocket, phone
    client_ip = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)

    # Performance metrics
    average_response_time = Column(Integer, default=0, nullable=False)  # milliseconds
    peak_memory_usage = Column(Integer, default=0, nullable=False)  # MB

    # Session metadata
    metadata = Column(JSON, default={}, nullable=False)

    # Relationships
    agent = relationship("Agent", foreign_keys=[agent_id])

    def __repr__(self):
        return f"<AgentSession(session_uuid={self.session_uuid}, status={self.status}, agent_id={self.agent_id})>"

    @property
    def is_active(self):
        """Check if session is currently active"""
        return self.status in ["starting", "running", "paused"]

    def calculate_duration(self):
        """Calculate session duration if ended"""
        if self.ended_at and self.started_at:
            delta = self.ended_at - self.started_at
            self.duration_seconds = int(delta.total_seconds())
        return self.duration_seconds