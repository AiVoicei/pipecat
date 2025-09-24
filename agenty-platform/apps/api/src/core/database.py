"""
Database configuration and session management for Agenty Platform
"""

import os
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session

from ..models.base import Base

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/agenty_dev"
)

# For async operations
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create engines
engine = create_engine(DATABASE_URL, echo=False)
async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)

# Create session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)


def get_db() -> Session:
    """Get synchronous database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get asynchronous database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_database():
    """Initialize database with tables"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def reset_database():
    """Reset database (drop and recreate tables)"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)