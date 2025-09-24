"""
Provider schemas for the Agenty platform.
Defines the structure for AI provider configurations, credentials, and marketplace data.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum

from .agent import ProviderType


class ProviderStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEPRECATED = "deprecated"
    BETA = "beta"


class PricingModel(str, Enum):
    FREE = "free"
    PAY_PER_USE = "pay_per_use"
    SUBSCRIPTION = "subscription"
    CUSTOM = "custom"


class ProviderPricingInfo(BaseModel):
    """Provider pricing information"""
    model: PricingModel
    cost_per_unit: Optional[float] = None
    unit: Optional[str] = None  # e.g., "per 1000 characters", "per minute"
    free_tier: Optional[Dict[str, Any]] = None
    subscription_tiers: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        schema_extra = {
            "example": {
                "model": "pay_per_use",
                "cost_per_unit": 0.006,
                "unit": "per 1000 characters",
                "free_tier": {
                    "characters_per_month": 10000
                }
            }
        }


class ProviderCapabilities(BaseModel):
    """Provider capabilities and features"""
    languages: List[str] = Field(default_factory=list)
    max_input_length: Optional[int] = None
    supports_streaming: bool = False
    supports_interruption: bool = False
    latency_ms: Optional[int] = None  # Average latency
    quality_score: Optional[float] = Field(None, ge=0, le=10)  # Quality rating 0-10

    class Config:
        schema_extra = {
            "example": {
                "languages": ["en", "he", "es", "fr"],
                "max_input_length": 4000,
                "supports_streaming": True,
                "supports_interruption": True,
                "latency_ms": 150,
                "quality_score": 8.5
            }
        }


class ProviderConfigurationSchema(BaseModel):
    """JSON schema for provider configuration"""
    properties: Dict[str, Any]
    required: List[str] = Field(default_factory=list)
    examples: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        schema_extra = {
            "example": {
                "properties": {
                    "api_key": {
                        "type": "string",
                        "description": "API key for authentication"
                    },
                    "voice_id": {
                        "type": "string",
                        "description": "Voice ID to use for synthesis"
                    },
                    "stability": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 1,
                        "description": "Voice stability (0-1)"
                    }
                },
                "required": ["api_key", "voice_id"],
                "examples": [
                    {
                        "api_key": "sk-...",
                        "voice_id": "21m00Tcm4TlvDq8ikWAM",
                        "stability": 0.5
                    }
                ]
            }
        }


class Provider(BaseModel):
    """Base provider model"""
    id: Optional[str] = None
    name: str = Field(..., description="Provider technical name (e.g., 'openai')")
    display_name: str = Field(..., description="Provider display name (e.g., 'OpenAI')")
    type: ProviderType
    description: str = Field(..., description="Provider description")
    status: ProviderStatus = ProviderStatus.AVAILABLE

    # Configuration
    configuration_schema: ProviderConfigurationSchema

    # Capabilities and pricing
    capabilities: ProviderCapabilities
    pricing: Optional[ProviderPricingInfo] = None

    # Documentation and links
    documentation_url: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None

    # Metadata
    version: str = Field("1.0.0", description="Provider integration version")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProviderCredential(BaseModel):
    """User provider credentials (encrypted)"""
    id: Optional[str] = None
    user_id: str
    provider_name: str
    provider_type: ProviderType
    encrypted_credentials: str  # JSON string, encrypted
    is_active: bool = True
    last_validated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProviderCredentialCreate(BaseModel):
    """Schema for creating provider credentials"""
    provider_name: str
    provider_type: ProviderType
    credentials: Dict[str, Any]  # Raw credentials (will be encrypted)

    class Config:
        schema_extra = {
            "example": {
                "provider_name": "openai",
                "provider_type": "llm",
                "credentials": {
                    "api_key": "sk-..."
                }
            }
        }


class ProviderCredentialUpdate(BaseModel):
    """Schema for updating provider credentials"""
    credentials: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ProviderCredentialResponse(BaseModel):
    """Response schema for provider credentials (without sensitive data)"""
    id: str
    provider_name: str
    provider_type: ProviderType
    is_active: bool
    last_validated_at: Optional[datetime]
    created_at: datetime
    has_credentials: bool = True  # Always true in response

    class Config:
        from_attributes = True


class ProviderValidationRequest(BaseModel):
    """Request to validate provider credentials"""
    provider_name: str
    provider_type: ProviderType
    credentials: Dict[str, Any]


class ProviderValidationResult(BaseModel):
    """Result of provider credential validation"""
    is_valid: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    tested_at: datetime


class ProviderUsageStats(BaseModel):
    """Provider usage statistics"""
    provider_name: str
    provider_type: ProviderType
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_latency_ms: Optional[float] = None
    last_used_at: Optional[datetime] = None
    cost_this_month: Optional[float] = None


class ProviderMarketplaceFilter(BaseModel):
    """Filters for provider marketplace"""
    type: Optional[ProviderType] = None
    status: Optional[ProviderStatus] = None
    languages: Optional[List[str]] = None
    pricing_model: Optional[PricingModel] = None
    supports_streaming: Optional[bool] = None
    min_quality_score: Optional[float] = Field(None, ge=0, le=10)
    max_latency_ms: Optional[int] = None


# Predefined provider registry data
STT_PROVIDERS = [
    "openai", "deepgram", "assemblyai", "azure", "google",
    "speechmatics", "gladia", "groq", "cartesia", "soniox",
    "aws", "sambanova"
]

LLM_PROVIDERS = [
    "openai", "anthropic", "google", "azure", "aws", "groq",
    "together", "fireworks", "cerebras", "deepseek", "perplexity",
    "ollama", "mistral", "qwen", "grok", "nim", "openrouter", "openpipe"
]

TTS_PROVIDERS = [
    "elevenlabs", "cartesia", "azure", "google", "aws",
    "playht", "xtts", "neuphonic", "rime", "sarvam"
]

ALL_PROVIDERS = {
    ProviderType.STT: STT_PROVIDERS,
    ProviderType.LLM: LLM_PROVIDERS,
    ProviderType.TTS: TTS_PROVIDERS
}