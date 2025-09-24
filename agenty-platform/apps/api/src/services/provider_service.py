"""
ProviderService - Manages AI provider integrations, credentials, and validation.
Handles secure storage and retrieval of user API keys for various AI providers.
"""

import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
from cryptography.fernet import Fernet

from ..schemas.provider import (
    Provider, ProviderCredential, ProviderValidationResult,
    ProviderCapabilities, ProviderPricingInfo, ProviderStatus,
    ALL_PROVIDERS, ProviderType
)


class ProviderService:
    """Service for managing AI provider integrations and credentials"""

    def __init__(self, encryption_key: str = None):
        """
        Initialize provider service with encryption key for credentials

        Args:
            encryption_key: Base64 encoded encryption key for credential storage
        """
        if encryption_key:
            self.cipher = Fernet(encryption_key.encode())
        else:
            # Generate a key for development (in production, use a secure key)
            self.cipher = Fernet(Fernet.generate_key())

        # Initialize provider registry
        self.provider_registry = self._initialize_provider_registry()

        # Mock database storage (replace with actual database)
        self.user_credentials: Dict[str, List[ProviderCredential]] = {}

    def _initialize_provider_registry(self) -> Dict[str, Provider]:
        """Initialize the provider registry with all supported providers"""
        registry = {}

        # STT Providers
        registry["openai_stt"] = Provider(
            id="openai_stt",
            name="openai",
            display_name="OpenAI Whisper",
            type=ProviderType.STT,
            description="OpenAI's Whisper speech-to-text model",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "OpenAI API key"},
                    "model": {
                        "type": "string",
                        "enum": ["whisper-1"],
                        "default": "whisper-1"
                    },
                    "language": {"type": "string", "description": "Language code (e.g., 'en', 'he')"}
                },
                "required": ["api_key"],
                "examples": [{"api_key": "sk-...", "model": "whisper-1", "language": "en"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "he", "es", "fr", "de", "it", "pt", "ru", "ja", "ko"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=300,
                quality_score=9.0
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.006,
                unit="per minute"
            ),
            documentation_url="https://platform.openai.com/docs/guides/speech-to-text"
        )

        registry["deepgram"] = Provider(
            id="deepgram",
            name="deepgram",
            display_name="Deepgram",
            type=ProviderType.STT,
            description="Deepgram's real-time speech-to-text API",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "Deepgram API key"},
                    "model": {
                        "type": "string",
                        "enum": ["nova-2", "enhanced", "base"],
                        "default": "nova-2"
                    },
                    "language": {"type": "string", "description": "Language code"}
                },
                "required": ["api_key"],
                "examples": [{"api_key": "xxx", "model": "nova-2", "language": "en"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "nl"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=250,
                quality_score=8.8
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0043,
                unit="per minute"
            )
        )

        # LLM Providers
        registry["openai_llm"] = Provider(
            id="openai_llm",
            name="openai",
            display_name="OpenAI GPT",
            type=ProviderType.LLM,
            description="OpenAI's GPT language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "OpenAI API key"},
                    "model": {
                        "type": "string",
                        "enum": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                        "default": "gpt-4"
                    },
                    "temperature": {"type": "number", "minimum": 0, "maximum": 2, "default": 0.7},
                    "max_tokens": {"type": "integer", "minimum": 1, "maximum": 4096, "default": 150}
                },
                "required": ["api_key"],
                "examples": [{"api_key": "sk-...", "model": "gpt-4", "temperature": 0.7}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "he", "es", "fr", "de", "it", "pt", "ru", "ja", "ko"],
                max_input_length=8192,
                supports_streaming=True,
                latency_ms=800,
                quality_score=9.5
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.03,
                unit="per 1000 tokens"
            )
        )

        registry["anthropic"] = Provider(
            id="anthropic",
            name="anthropic",
            display_name="Anthropic Claude",
            type=ProviderType.LLM,
            description="Anthropic's Claude language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "Anthropic API key"},
                    "model": {
                        "type": "string",
                        "enum": ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
                        "default": "claude-3-sonnet-20240229"
                    },
                    "max_tokens": {"type": "integer", "minimum": 1, "maximum": 4096, "default": 150}
                },
                "required": ["api_key"],
                "examples": [{"api_key": "sk-ant-...", "model": "claude-3-sonnet-20240229"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "ja"],
                max_input_length=200000,
                supports_streaming=True,
                latency_ms=900,
                quality_score=9.3
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.015,
                unit="per 1000 tokens"
            )
        )

        # TTS Providers
        registry["elevenlabs"] = Provider(
            id="elevenlabs",
            name="elevenlabs",
            display_name="ElevenLabs",
            type=ProviderType.TTS,
            description="ElevenLabs high-quality text-to-speech",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "ElevenLabs API key"},
                    "voice_id": {"type": "string", "description": "Voice ID to use"},
                    "stability": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.5},
                    "similarity_boost": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.8}
                },
                "required": ["api_key", "voice_id"],
                "examples": [{"api_key": "xxx", "voice_id": "21m00Tcm4TlvDq8ikWAM"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "pl", "hi"],
                supports_streaming=True,
                latency_ms=400,
                quality_score=9.7
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.22,
                unit="per 1000 characters"
            )
        )

        registry["cartesia"] = Provider(
            id="cartesia",
            name="cartesia",
            display_name="Cartesia",
            type=ProviderType.TTS,
            description="Cartesia real-time text-to-speech",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "Cartesia API key"},
                    "voice_id": {"type": "string", "description": "Voice ID"},
                    "model_id": {"type": "string", "default": "sonic-english"}
                },
                "required": ["api_key", "voice_id"],
                "examples": [{"api_key": "xxx", "voice_id": "a0e99841-438c-4a64-b679-ae501e7d6091"}]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "pt"],
                supports_streaming=True,
                latency_ms=150,
                quality_score=8.9
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0625,
                unit="per 1000 characters"
            )
        )

        return registry

    async def get_providers(
        self,
        provider_type: Optional[ProviderType] = None,
        status: Optional[ProviderStatus] = None
    ) -> List[Provider]:
        """Get list of available providers"""
        providers = list(self.provider_registry.values())

        if provider_type:
            providers = [p for p in providers if p.type == provider_type]

        if status:
            providers = [p for p in providers if p.status == status]

        return providers

    async def get_provider_by_name(self, name: str, provider_type: ProviderType) -> Optional[Provider]:
        """Get provider by name and type"""
        provider_id = f"{name}_{provider_type}" if provider_type != ProviderType.STT else name
        if provider_id not in self.provider_registry:
            provider_id = f"{name}_stt" if provider_type == ProviderType.STT else f"{name}_{provider_type}"

        return self.provider_registry.get(provider_id)

    async def store_user_credentials(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType,
        credentials: Dict[str, Any]
    ) -> ProviderCredential:
        """Store encrypted user credentials for a provider"""

        # Encrypt credentials
        credentials_json = json.dumps(credentials)
        encrypted_credentials = self.cipher.encrypt(credentials_json.encode()).decode()

        # Create credential record
        credential = ProviderCredential(
            id=f"{user_id}_{provider_name}_{provider_type}",
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type,
            encrypted_credentials=encrypted_credentials,
            is_active=True,
            created_at=datetime.now()
        )

        # Store in mock database
        if user_id not in self.user_credentials:
            self.user_credentials[user_id] = []

        # Remove existing credential for same provider
        self.user_credentials[user_id] = [
            c for c in self.user_credentials[user_id]
            if not (c.provider_name == provider_name and c.provider_type == provider_type)
        ]

        self.user_credentials[user_id].append(credential)

        return credential

    async def get_user_credentials(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> Dict[str, Any]:
        """Get decrypted user credentials for a provider"""

        if user_id not in self.user_credentials:
            raise ValueError(f"No credentials found for user {user_id}")

        # Find credential
        credential = None
        for cred in self.user_credentials[user_id]:
            if cred.provider_name == provider_name and cred.provider_type == provider_type:
                credential = cred
                break

        if not credential or not credential.is_active:
            raise ValueError(f"No active credentials for {provider_name} ({provider_type})")

        # Decrypt credentials
        decrypted_bytes = self.cipher.decrypt(credential.encrypted_credentials.encode())
        credentials = json.loads(decrypted_bytes.decode())

        return credentials

    async def user_has_credentials(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> bool:
        """Check if user has credentials for a provider"""
        try:
            await self.get_user_credentials(user_id, provider_name, provider_type)
            return True
        except ValueError:
            return False

    async def validate_provider_credentials(
        self,
        provider_name: str,
        provider_type: ProviderType,
        credentials: Dict[str, Any]
    ) -> ProviderValidationResult:
        """Validate provider credentials by testing connection"""

        try:
            # Get provider info
            provider = await self.get_provider_by_name(provider_name, provider_type)
            if not provider:
                return ProviderValidationResult(
                    is_valid=False,
                    message=f"Provider {provider_name} not found",
                    tested_at=datetime.now()
                )

            # Test credentials based on provider type
            is_valid = await self._test_provider_connection(provider_name, provider_type, credentials)

            return ProviderValidationResult(
                is_valid=is_valid,
                message="Credentials are valid" if is_valid else "Invalid credentials",
                tested_at=datetime.now()
            )

        except Exception as e:
            return ProviderValidationResult(
                is_valid=False,
                message=f"Validation error: {str(e)}",
                tested_at=datetime.now()
            )

    async def _test_provider_connection(
        self,
        provider_name: str,
        provider_type: ProviderType,
        credentials: Dict[str, Any]
    ) -> bool:
        """Test provider connection with given credentials"""

        # Mock validation for now - in production, make actual API calls
        required_fields = {
            "openai": ["api_key"],
            "anthropic": ["api_key"],
            "elevenlabs": ["api_key"],
            "deepgram": ["api_key"],
            "cartesia": ["api_key"]
        }

        provider_required = required_fields.get(provider_name, ["api_key"])

        # Check if all required fields are present
        for field in provider_required:
            if field not in credentials or not credentials[field]:
                return False

        # Mock API validation - replace with actual API calls
        api_key = credentials.get("api_key", "")
        if len(api_key) < 10:  # Basic check
            return False

        # Simulate async API call
        await asyncio.sleep(0.1)

        return True  # Mock success

    async def get_user_provider_list(self, user_id: str) -> List[Dict[str, Any]]:
        """Get list of providers with user credential status"""
        all_providers = await self.get_providers()
        result = []

        for provider in all_providers:
            has_credentials = await self.user_has_credentials(
                user_id, provider.name, provider.type
            )

            result.append({
                "provider": provider.dict(),
                "has_credentials": has_credentials,
                "is_configured": has_credentials
            })

        return result

    async def delete_user_credentials(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> bool:
        """Delete user credentials for a provider"""
        if user_id not in self.user_credentials:
            return False

        # Remove credential
        original_count = len(self.user_credentials[user_id])
        self.user_credentials[user_id] = [
            c for c in self.user_credentials[user_id]
            if not (c.provider_name == provider_name and c.provider_type == provider_type)
        ]

        return len(self.user_credentials[user_id]) < original_count