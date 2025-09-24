"""
Provider API endpoints for the Agenty platform.
Handles provider marketplace, credential management, and validation.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status

from schemas.provider import (
    Provider, ProviderCredentialCreate, ProviderCredentialUpdate,
    ProviderCredentialResponse, ProviderValidationRequest,
    ProviderValidationResult, ProviderMarketplaceFilter,
    ProviderType, ProviderStatus
)
from services.provider_service import ProviderService
from utils.dependencies import get_current_user, get_provider_service
from core.dependencies import get_data_layer_dependency, get_encryption_key
from core.data_layer import DataLayer

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/", response_model=List[Provider])
async def get_providers(
    provider_type: Optional[ProviderType] = None,
    status: Optional[ProviderStatus] = None,
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get list of available providers"""
    try:
        providers = await provider_service.get_providers(
            provider_type=provider_type,
            status=status
        )
        return providers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get providers: {str(e)}"
        )


@router.get("/marketplace")
async def get_provider_marketplace(
    current_user: dict = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get provider marketplace with user credential status"""
    try:
        marketplace_data = await provider_service.get_user_provider_list(current_user["id"])
        return {"providers": marketplace_data}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get marketplace data: {str(e)}"
        )


@router.get("/{provider_name}", response_model=Provider)
async def get_provider(
    provider_name: str,
    provider_type: ProviderType,
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get specific provider details"""
    try:
        provider = await provider_service.get_provider_by_name(provider_name, provider_type)

        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider {provider_name} not found"
            )

        return provider

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get provider: {str(e)}"
        )


@router.post("/credentials", response_model=ProviderCredentialResponse)
async def store_provider_credentials(
    credential_data: ProviderCredentialCreate,
    current_user: dict = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Store user credentials for a provider"""
    try:
        # Validate credentials first
        validation_result = await provider_service.validate_provider_credentials(
            credential_data.provider_name,
            credential_data.provider_type,
            credential_data.credentials
        )

        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid credentials: {validation_result.message}"
            )

        # Store credentials
        credential = await provider_service.store_user_credentials(
            user_id=current_user["id"],
            provider_name=credential_data.provider_name,
            provider_type=credential_data.provider_type,
            credentials=credential_data.credentials
        )

        # Update validation timestamp
        credential.last_validated_at = validation_result.tested_at

        return ProviderCredentialResponse(
            id=credential.id,
            provider_name=credential.provider_name,
            provider_type=credential.provider_type,
            is_active=credential.is_active,
            last_validated_at=credential.last_validated_at,
            created_at=credential.created_at,
            has_credentials=True
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store credentials: {str(e)}"
        )


@router.get("/credentials/", response_model=List[ProviderCredentialResponse])
async def get_user_credentials(
    current_user: dict = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get user's stored provider credentials (without sensitive data)"""
    try:
        marketplace_data = await provider_service.get_user_provider_list(current_user["id"])

        credentials = []
        for item in marketplace_data:
            if item["has_credentials"]:
                provider = item["provider"]
                # Mock credential response since we don't store actual credential objects
                credentials.append(ProviderCredentialResponse(
                    id=f"{current_user['id']}_{provider['name']}_{provider['type']}",
                    provider_name=provider["name"],
                    provider_type=provider["type"],
                    is_active=True,
                    last_validated_at=None,
                    created_at=provider.get("created_at"),
                    has_credentials=True
                ))

        return credentials

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get credentials: {str(e)}"
        )


@router.put("/credentials/{provider_name}")
async def update_provider_credentials(
    provider_name: str,
    provider_type: ProviderType,
    update_data: ProviderCredentialUpdate,
    current_user: dict = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Update user credentials for a provider"""
    try:
        # Check if user has existing credentials
        has_credentials = await provider_service.user_has_credentials(
            current_user["id"], provider_name, provider_type
        )

        if not has_credentials:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No credentials found for this provider"
            )

        # If updating credentials, validate them first
        if update_data.credentials:
            validation_result = await provider_service.validate_provider_credentials(
                provider_name, provider_type, update_data.credentials
            )

            if not validation_result.is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid credentials: {validation_result.message}"
                )

            # Store updated credentials
            await provider_service.store_user_credentials(
                user_id=current_user["id"],
                provider_name=provider_name,
                provider_type=provider_type,
                credentials=update_data.credentials
            )

        return {"message": "Credentials updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update credentials: {str(e)}"
        )


@router.delete("/credentials/{provider_name}")
async def delete_provider_credentials(
    provider_name: str,
    provider_type: ProviderType,
    current_user: dict = Depends(get_current_user),
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Delete user credentials for a provider"""
    try:
        success = await provider_service.delete_user_credentials(
            current_user["id"], provider_name, provider_type
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No credentials found for this provider"
            )

        return {"message": "Credentials deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete credentials: {str(e)}"
        )


@router.post("/validate", response_model=ProviderValidationResult)
async def validate_provider_credentials(
    validation_data: ProviderValidationRequest,
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Validate provider credentials without storing them"""
    try:
        result = await provider_service.validate_provider_credentials(
            validation_data.provider_name,
            validation_data.provider_type,
            validation_data.credentials
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate credentials: {str(e)}"
        )


@router.get("/types/stt")
async def get_stt_providers(
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get all STT providers"""
    try:
        providers = await provider_service.get_providers(provider_type=ProviderType.STT)
        return {"providers": providers}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get STT providers: {str(e)}"
        )


@router.get("/types/llm")
async def get_llm_providers(
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get all LLM providers"""
    try:
        providers = await provider_service.get_providers(provider_type=ProviderType.LLM)
        return {"providers": providers}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get LLM providers: {str(e)}"
        )


@router.get("/types/tts")
async def get_tts_providers(
    provider_service: ProviderService = Depends(get_provider_service)
):
    """Get all TTS providers"""
    try:
        providers = await provider_service.get_providers(provider_type=ProviderType.TTS)
        return {"providers": providers}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get TTS providers: {str(e)}"
        )


@router.get("/stats/{provider_name}")
async def get_provider_stats(
    provider_name: str,
    provider_type: ProviderType,
    current_user: dict = Depends(get_current_user)
):
    """Get usage statistics for a provider"""
    try:
        # Mock statistics for now
        stats = {
            "provider_name": provider_name,
            "provider_type": provider_type,
            "total_requests": 1250,
            "successful_requests": 1180,
            "failed_requests": 70,
            "success_rate": 94.4,
            "average_latency_ms": 450,
            "last_used_at": "2024-01-15T10:30:00Z",
            "cost_this_month": 45.67
        }

        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get provider stats: {str(e)}"
        )