"""
Base database model configuration
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func


Base = declarative_base()


class BaseModel(Base):
    """Base model with common fields"""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        """Convert model to dictionary"""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}