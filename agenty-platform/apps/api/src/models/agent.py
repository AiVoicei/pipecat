"""
Agent and Agent Template database models
"""

from sqlalchemy import Column, String, Text, JSON, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Agent(BaseModel):
    """Agent model for storing agent configurations"""
    __tablename__ = "agents"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Agent configuration (JSON storing the complete pipeline config)
    configuration = Column(JSON, nullable=False)

    # Deployment configuration
    deployment_config = Column(JSON, default={}, nullable=False)

    # Status: draft, active, inactive, error
    status = Column(String(50), default="draft", nullable=False)

    # Template reference (optional)
    template_id = Column(UUID(as_uuid=True), ForeignKey("agent_templates.id"), nullable=True)

    # Agent metadata
    tags = Column(JSON, default=[], nullable=False)  # List of tags for categorization
    version = Column(String(20), default="1.0.0", nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)  # For sharing agents
    gender = Column(String(20), default="female", nullable=False)  # Agent voice gender: male, female

    # Usage statistics
    total_conversations = Column(Integer, default=0, nullable=False)
    total_runtime_minutes = Column(Integer, default=0, nullable=False)
    last_used_at = Column(String, nullable=True)  # ISO timestamp

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    template = relationship("AgentTemplate", foreign_keys=[template_id])

    def __repr__(self):
        return f"<Agent(name={self.name}, status={self.status}, user_id={self.user_id})>"


class AgentTemplate(BaseModel):
    """Agent template model for pre-built agent configurations"""
    __tablename__ = "agent_templates"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # e.g., "customer_service", "education", "entertainment"

    # Template configuration (JSON storing the base pipeline config)
    configuration = Column(JSON, nullable=False)

    # Template metadata
    tags = Column(JSON, default=[], nullable=False)
    difficulty_level = Column(String(20), default="beginner", nullable=False)  # beginner, intermediate, advanced
    estimated_setup_time = Column(Integer, default=5, nullable=False)  # minutes

    # Publishing info
    is_public = Column(Boolean, default=False, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Usage statistics
    usage_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Integer, default=0, nullable=False)  # 0-5 stars * 10 (for precision)

    # Featured template
    is_featured = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<AgentTemplate(name={self.name}, category={self.category}, usage_count={self.usage_count})>"