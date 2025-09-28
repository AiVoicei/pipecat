"""
User database model
"""

from sqlalchemy import Column, String, Boolean, Text, JSON
from .base import BaseModel


class User(BaseModel):
    """User model for authentication and profile management"""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=True, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Profile information
    organization = Column(String(255), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    preferred_language = Column(String(5), default="en", nullable=False)

    # Subscription and billing
    subscription_tier = Column(String(50), default="free", nullable=False)
    subscription_status = Column(String(50), default="active", nullable=False)

    # Metadata
    profile_metadata = Column('metadata', JSON, default=dict, nullable=False)

    def __repr__(self):
        return f"<User(email={self.email}, username={self.username})>"