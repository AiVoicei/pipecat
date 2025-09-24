"""
Dependency injection utilities for the Agenty platform API.
Provides shared instances and authentication dependencies.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..services.agent_factory import AgentFactory
from ..services.provider_service import ProviderService

# Global service instances
_agent_factory: Optional[AgentFactory] = None
_provider_service: Optional[ProviderService] = None

# Authentication
security = HTTPBearer(auto_error=False)


def get_provider_service() -> ProviderService:
    """Get or create provider service instance"""
    global _provider_service

    if _provider_service is None:
        # Initialize with encryption key (in production, use secure key from env)
        _provider_service = ProviderService(
            encryption_key="your-secure-encryption-key-here"  # TODO: Use env variable
        )

    return _provider_service


def get_agent_factory() -> AgentFactory:
    """Get or create agent factory instance"""
    global _agent_factory

    if _agent_factory is None:
        provider_service = get_provider_service()
        _agent_factory = AgentFactory(provider_service)

    return _agent_factory


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current authenticated user from JWT token.
    For now, this is a mock implementation - replace with actual JWT validation.
    """

    # Mock authentication for development
    # In production, validate JWT token and return user data
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Mock user data - replace with actual JWT decoding
    mock_user = {
        "id": "user_123",
        "email": "user@example.com",
        "name": "Test User",
        "subscription_tier": "pro",
        "created_at": "2024-01-01T00:00:00Z"
    }

    return mock_user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, otherwise return None.
    Used for endpoints that work with or without authentication.
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_subscription_tier(required_tier: str):
    """
    Dependency factory for requiring specific subscription tiers.
    Usage: Depends(require_subscription_tier("pro"))
    """
    def check_tier(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_tier = current_user.get("subscription_tier", "free")

        # Define tier hierarchy
        tier_levels = {
            "free": 0,
            "starter": 1,
            "pro": 2,
            "enterprise": 3,
            "white_label": 4
        }

        user_level = tier_levels.get(user_tier, 0)
        required_level = tier_levels.get(required_tier, 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription tier '{required_tier}' or higher required"
            )

        return current_user

    return check_tier


def require_admin():
    """Dependency for admin-only endpoints"""
    def check_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return current_user

    return check_admin


# Rate limiting dependency (mock implementation)
async def rate_limit_check(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check rate limits for the current user.
    In production, integrate with Redis for distributed rate limiting.
    """
    # Mock rate limiting - replace with actual implementation
    # This would check user's API usage against their subscription limits

    return current_user


# Database session dependency (mock for now)
async def get_db_session():
    """
    Get database session.
    Replace with actual database connection in production.
    """
    # Mock database session
    class MockDB:
        def commit(self):
            pass

        def rollback(self):
            pass

        def close(self):
            pass

    db = MockDB()
    try:
        yield db
    finally:
        db.close()


# Configuration dependency
def get_app_config() -> Dict[str, Any]:
    """Get application configuration"""
    return {
        "app_name": "Agenty Platform",
        "version": "1.0.0",
        "environment": "development",  # TODO: Use env variable
        "max_agents_per_user": {
            "free": 1,
            "starter": 3,
            "pro": 10,
            "enterprise": 100,
            "white_label": -1  # unlimited
        },
        "supported_languages": ["en", "he", "es", "fr", "de", "it", "pt"],
        "default_agent_timeout": 1800,  # 30 minutes
        "max_session_duration": 3600   # 1 hour
    }