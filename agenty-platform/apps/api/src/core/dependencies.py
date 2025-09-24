"""
Dependency Injection System

Provides centralized dependency management with easy toggling between
mock and database implementations.
"""

import os
from typing import Optional
from functools import lru_cache

from .data_layer import DataLayer, MockDataLayer, DatabaseDataLayer


# Configuration
USE_DATABASE = os.getenv("USE_DATABASE", "false").lower() == "true"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/agenty_dev")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", None)


@lru_cache()
def get_data_layer() -> DataLayer:
    """
    Get data layer implementation based on configuration

    Returns:
        DataLayer: Either MockDataLayer or DatabaseDataLayer
    """
    if USE_DATABASE:
        return DatabaseDataLayer(DATABASE_URL)
    else:
        return MockDataLayer()


@lru_cache()
def get_encryption_key() -> Optional[str]:
    """
    Get encryption key for credential storage

    Returns:
        str: Encryption key or None for auto-generation
    """
    return ENCRYPTION_KEY


# FastAPI dependency functions
async def get_data_layer_dependency() -> DataLayer:
    """FastAPI dependency for data layer"""
    return get_data_layer()


def get_config() -> dict:
    """Get current configuration"""
    return {
        "use_database": USE_DATABASE,
        "database_url": DATABASE_URL if USE_DATABASE else None,
        "data_layer_type": "database" if USE_DATABASE else "mock",
        "encryption_configured": ENCRYPTION_KEY is not None
    }