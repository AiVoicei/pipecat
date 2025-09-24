"""
Provider and Provider Credentials database models
"""

from sqlalchemy import Column, String, Text, JSON, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel


class Provider(BaseModel):
    """Provider model for storing AI service provider information"""
    __tablename__ = "providers"

    name = Column(String(100), unique=True, nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # stt, llm, tts, image, etc.
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Configuration schema (JSON Schema for validation)
    configuration_schema = Column(JSON, nullable=False)

    # Provider capabilities and metadata
    capabilities = Column(JSON, default={}, nullable=False)
    pricing_info = Column(JSON, default={}, nullable=False)

    # Provider status and availability
    is_available = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="available", nullable=False)  # available, maintenance, deprecated

    # Documentation and support
    documentation_url = Column(String(500), nullable=True)
    support_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)

    # Provider metadata
    tags = Column(JSON, default=[], nullable=False)
    popularity_score = Column(Integer, default=0, nullable=False)  # For sorting in UI

    def __repr__(self):
        return f"<Provider(name={self.name}, type={self.type}, display_name={self.display_name})>"


class UserProviderCredential(BaseModel):
    """User provider credentials model for storing encrypted API keys"""
    __tablename__ = "user_provider_credentials"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    provider_name = Column(String(100), nullable=False, index=True)
    provider_type = Column(String(50), nullable=False)  # stt, llm, tts

    # Encrypted credentials (JSON containing API keys, secrets, etc.)
    encrypted_credentials = Column(Text, nullable=False)

    # Credential status and validation
    is_active = Column(Boolean, default=True, nullable=False)
    last_validated_at = Column(DateTime, nullable=True)
    validation_status = Column(String(50), default="unknown", nullable=False)  # valid, invalid, expired, unknown
    validation_message = Column(Text, nullable=True)

    # Usage tracking
    last_used_at = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0, nullable=False)

    # Credential metadata
    credential_name = Column(String(255), nullable=True)  # User-friendly name
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def __repr__(self):
        return f"<UserProviderCredential(user_id={self.user_id}, provider={self.provider_name}, type={self.provider_type})>"