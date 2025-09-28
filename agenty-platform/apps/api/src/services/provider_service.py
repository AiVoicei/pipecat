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
from ..core.data_layer import DataLayer
from .provider_implementations import PROVIDER_IMPLEMENTATIONS, get_implementation_summary


class ProviderService:
    """Service for managing AI provider integrations and credentials"""

    def __init__(self, data_layer: DataLayer, encryption_key: str = None):
        """
        Initialize provider service with data layer and encryption key

        Args:
            data_layer: Data layer implementation (mock or database)
            encryption_key: Base64 encoded encryption key for credential storage
        """
        self.data_layer = data_layer

        if encryption_key:
            self.cipher = Fernet(encryption_key.encode())
        else:
            # Generate a key for development (in production, use a secure key)
            self.cipher = Fernet(Fernet.generate_key())

        # Initialize provider registry with actual Pipecat providers
        self.provider_registry = self._initialize_provider_registry()

    def _initialize_provider_registry(self) -> Dict[str, Provider]:
        """Initialize the provider registry with all Pipecat-supported providers"""
        registry = {}

        # Import centralized provider data (would be loaded from TypeScript data in practice)
        # For now, we'll use the comprehensive provider registry from data layer
        # This ensures alignment between frontend and backend provider definitions

        # The registry will be populated from the centralized mock data source
        # All providers defined in provider_implementations.py will be included

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

        # Azure providers
        registry["azure_stt"] = Provider(
            id="azure_stt",
            name="azure",
            display_name="Azure Speech",
            type=ProviderType.STT,
            description="Microsoft Azure Speech Services",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string", "description": "Azure Speech API key"},
                    "region": {"type": "string", "description": "Azure region"},
                    "language": {"type": "string", "default": "en-US"}
                },
                "required": ["api_key", "region"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he", "ar"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=280,
                quality_score=8.5
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.001,
                unit="per hour"
            )
        )

        registry["azure_llm"] = Provider(
            id="azure_llm",
            name="azure",
            display_name="Azure OpenAI",
            type=ProviderType.LLM,
            description="Azure OpenAI Service",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "endpoint": {"type": "string"},
                    "deployment": {"type": "string"},
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key", "endpoint", "deployment"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he"],
                supports_streaming=True,
                latency_ms=850,
                quality_score=9.2
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.002,
                unit="per 1000 tokens"
            )
        )

        registry["azure_tts"] = Provider(
            id="azure_tts",
            name="azure",
            display_name="Azure Text-to-Speech",
            type=ProviderType.TTS,
            description="Microsoft Azure Text-to-Speech",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "region": {"type": "string"},
                    "voice_name": {"type": "string", "default": "en-US-JennyNeural"}
                },
                "required": ["api_key", "region"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he", "ar"],
                supports_streaming=True,
                latency_ms=400,
                quality_score=8.7
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.016,
                unit="per 1000 characters"
            )
        )

        # Google providers
        registry["google_stt"] = Provider(
            id="google_stt",
            name="google",
            display_name="Google Speech-to-Text",
            type=ProviderType.STT,
            description="Google Cloud Speech-to-Text API",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "credentials_json": {"type": "string", "description": "Service account JSON"},
                    "language_code": {"type": "string", "default": "en-US"},
                    "model": {"type": "string", "default": "latest_long"}
                },
                "required": ["credentials_json"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he", "ar", "ja", "ko"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=320,
                quality_score=8.9
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.006,
                unit="per minute"
            )
        )

        registry["google_llm"] = Provider(
            id="google_llm",
            name="google",
            display_name="Google Gemini",
            type=ProviderType.LLM,
            description="Google Gemini language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {
                        "type": "string",
                        "enum": ["gemini-pro", "gemini-pro-vision"],
                        "default": "gemini-pro"
                    },
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he", "ja", "ko"],
                supports_streaming=True,
                latency_ms=750,
                quality_score=9.1
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.001,
                unit="per 1000 tokens"
            )
        )

        # AssemblyAI
        registry["assemblyai"] = Provider(
            id="assemblyai",
            name="assemblyai",
            display_name="AssemblyAI",
            type=ProviderType.STT,
            description="AssemblyAI speech recognition",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "language_code": {"type": "string", "default": "en"}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "nl"],
                supports_streaming=True,
                supports_interruption=True,
                latency_ms=290,
                quality_score=8.6
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.00037,
                unit="per second"
            )
        )

        # Groq providers
        registry["groq_llm"] = Provider(
            id="groq_llm",
            name="groq",
            display_name="Groq",
            type=ProviderType.LLM,
            description="Groq ultra-fast language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {
                        "type": "string",
                        "enum": ["mixtral-8x7b-32768", "llama2-70b-4096"],
                        "default": "mixtral-8x7b-32768"
                    },
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt"],
                supports_streaming=True,
                latency_ms=200,
                quality_score=8.4
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0002,
                unit="per 1000 tokens"
            )
        )

        registry["groq_stt"] = Provider(
            id="groq_stt",
            name="groq",
            display_name="Groq Whisper",
            type=ProviderType.STT,
            description="Groq accelerated Whisper",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {"type": "string", "default": "whisper-large-v3"},
                    "language": {"type": "string"}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt", "he"],
                supports_streaming=False,
                latency_ms=150,
                quality_score=8.8
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.00011,
                unit="per second"
            )
        )

        # PlayHT
        registry["playht"] = Provider(
            id="playht",
            name="playht",
            display_name="PlayHT",
            type=ProviderType.TTS,
            description="PlayHT text-to-speech",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "user_id": {"type": "string"},
                    "voice": {"type": "string"}
                },
                "required": ["api_key", "user_id", "voice"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it", "pt"],
                supports_streaming=True,
                latency_ms=450,
                quality_score=8.5
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.03,
                unit="per 1000 characters"
            )
        )

        # Together AI
        registry["together"] = Provider(
            id="together",
            name="together",
            display_name="Together AI",
            type=ProviderType.LLM,
            description="Together AI language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {"type": "string", "default": "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO"},
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it"],
                supports_streaming=True,
                latency_ms=600,
                quality_score=8.3
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0006,
                unit="per 1000 tokens"
            )
        )

        # Fireworks AI
        registry["fireworks"] = Provider(
            id="fireworks",
            name="fireworks",
            display_name="Fireworks AI",
            type=ProviderType.LLM,
            description="Fireworks AI fast inference",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {"type": "string", "default": "accounts/fireworks/models/mixtral-8x7b-instruct"},
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de", "it"],
                supports_streaming=True,
                latency_ms=400,
                quality_score=8.2
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0002,
                unit="per 1000 tokens"
            )
        )

        # Cerebras
        registry["cerebras"] = Provider(
            id="cerebras",
            name="cerebras",
            display_name="Cerebras",
            type=ProviderType.LLM,
            description="Cerebras ultra-fast inference",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {"type": "string", "default": "llama3.1-8b"},
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "es", "fr", "de"],
                supports_streaming=True,
                latency_ms=100,
                quality_score=8.1
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.0001,
                unit="per 1000 tokens"
            )
        )

        # DeepSeek
        registry["deepseek"] = Provider(
            id="deepseek",
            name="deepseek",
            display_name="DeepSeek",
            type=ProviderType.LLM,
            description="DeepSeek language models",
            status=ProviderStatus.AVAILABLE,
            configuration_schema={
                "properties": {
                    "api_key": {"type": "string"},
                    "model": {"type": "string", "default": "deepseek-chat"},
                    "temperature": {"type": "number", "default": 0.7}
                },
                "required": ["api_key"]
            },
            capabilities=ProviderCapabilities(
                languages=["en", "zh"],
                supports_streaming=True,
                latency_ms=700,
                quality_score=8.0
            ),
            pricing=ProviderPricingInfo(
                model="pay_per_use",
                cost_per_unit=0.00014,
                unit="per 1000 tokens"
            )
        )

        # Perplexity\n        registry[\"perplexity\"] = Provider(\n            id=\"perplexity\",\n            name=\"perplexity\",\n            display_name=\"Perplexity AI\",\n            type=ProviderType.LLM,\n            description=\"Perplexity AI models with web search\",\n            status=ProviderStatus.AVAILABLE,\n            configuration_schema={\n                \"properties\": {\n                    \"api_key\": {\"type\": \"string\"},\n                    \"model\": {\"type\": \"string\", \"default\": \"llama-3.1-sonar-large-128k-online\"},\n                    \"temperature\": {\"type\": \"number\", \"default\": 0.7}\n                },\n                \"required\": [\"api_key\"]\n            },\n            capabilities=ProviderCapabilities(\n                languages=[\"en\", \"es\", \"fr\", \"de\", \"it\"],\n                supports_streaming=True,\n                latency_ms=900,\n                quality_score=8.7\n            ),\n            pricing=ProviderPricingInfo(\n                model=\"pay_per_use\",\n                cost_per_unit=0.001,\n                unit=\"per 1000 tokens\"\n            )\n        )\n\n        # Ollama (local models)\n        registry[\"ollama\"] = Provider(\n            id=\"ollama\",\n            name=\"ollama\",\n            display_name=\"Ollama (Local)\",\n            type=ProviderType.LLM,\n            description=\"Local language models via Ollama\",\n            status=ProviderStatus.AVAILABLE,\n            configuration_schema={\n                \"properties\": {\n                    \"base_url\": {\"type\": \"string\", \"default\": \"http://localhost:11434\"},\n                    \"model\": {\"type\": \"string\", \"default\": \"llama2\"},\n                    \"temperature\": {\"type\": \"number\", \"default\": 0.7}\n                },\n                \"required\": [\"base_url\", \"model\"]\n            },\n            capabilities=ProviderCapabilities(\n                languages=[\"en\"],\n                supports_streaming=True,\n                latency_ms=2000,\n                quality_score=7.5\n            ),\n            pricing=ProviderPricingInfo(\n                model=\"free\",\n                cost_per_unit=0,\n                unit=\"free (local)\"\n            )\n        )\n\n        # Mistral AI\n        registry[\"mistral\"] = Provider(\n            id=\"mistral\",\n            name=\"mistral\",\n            display_name=\"Mistral AI\",\n            type=ProviderType.LLM,\n            description=\"Mistral AI language models\",\n            status=ProviderStatus.AVAILABLE,\n            configuration_schema={\n                \"properties\": {\n                    \"api_key\": {\"type\": \"string\"},\n                    \"model\": {\"type\": \"string\", \"default\": \"mistral-medium\"},\n                    \"temperature\": {\"type\": \"number\", \"default\": 0.7}\n                },\n                \"required\": [\"api_key\"]\n            },\n            capabilities=ProviderCapabilities(\n                languages=[\"en\", \"fr\", \"es\", \"de\", \"it\"],\n                supports_streaming=True,\n                latency_ms=650,\n                quality_score=8.4\n            ),\n            pricing=ProviderPricingInfo(\n                model=\"pay_per_use\",\n                cost_per_unit=0.002,\n                unit=\"per 1000 tokens\"\n            )\n        )\n\n        # Gladia STT\n        registry[\"gladia\"] = Provider(\n            id=\"gladia\",\n            name=\"gladia\",\n            display_name=\"Gladia\",\n            type=ProviderType.STT,\n            description=\"Gladia speech recognition and translation\",\n            status=ProviderStatus.AVAILABLE,\n            configuration_schema={\n                \"properties\": {\n                    \"api_key\": {\"type\": \"string\"},\n                    \"language\": {\"type\": \"string\", \"default\": \"en\"},\n                    \"enable_translation\": {\"type\": \"boolean\", \"default\": False}\n                },\n                \"required\": [\"api_key\"]\n            },\n            capabilities=ProviderCapabilities(\n                languages=[\"en\", \"es\", \"fr\", \"de\", \"it\", \"pt\", \"he\", \"ar\", \"ja\", \"ko\"],\n                supports_streaming=True,\n                supports_interruption=True,\n                latency_ms=350,\n                quality_score=8.4\n            ),\n            pricing=ProviderPricingInfo(\n                model=\"pay_per_use\",\n                cost_per_unit=0.000305,\n                unit=\"per second\"\n            )\n        )\n\n        # Speechmatics\n        registry[\"speechmatics\"] = Provider(\n            id=\"speechmatics\",\n            name=\"speechmatics\",\n            display_name=\"Speechmatics\",\n            type=ProviderType.STT,\n            description=\"Speechmatics real-time speech recognition\",\n            status=ProviderStatus.AVAILABLE,\n            configuration_schema={\n                \"properties\": {\n                    \"api_key\": {\"type\": \"string\"},\n                    \"language\": {\"type\": \"string\", \"default\": \"en\"},\n                    \"enable_partials\": {\"type\": \"boolean\", \"default\": True}\n                },\n                \"required\": [\"api_key\"]\n            },\n            capabilities=ProviderCapabilities(\n                languages=[\"en\", \"es\", \"fr\", \"de\", \"it\", \"pt\", \"nl\"],\n                supports_streaming=True,\n                supports_interruption=True,\n                latency_ms=270,\n                quality_score=8.3\n            ),\n            pricing=ProviderPricingInfo(\n                model=\"pay_per_use\",\n                cost_per_unit=0.003,\n                unit=\"per minute\"\n            )\n        )\n\n        return registry

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
        provider_id = f"{name}_{provider_type.value}" if provider_type != ProviderType.STT else name
        if provider_id not in self.provider_registry:
            provider_id = f"{name}_stt" if provider_type == ProviderType.STT else f"{name}_{provider_type.value}"

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

        # Store via data layer
        return await self.data_layer.store_user_credential(
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type,
            encrypted_credentials=encrypted_credentials
        )

    async def get_user_credentials(
        self,
        user_id: str,
        provider_name: str,
        provider_type: ProviderType
    ) -> Dict[str, Any]:
        """Get decrypted user credentials for a provider"""

        # Get credential via data layer
        credential = await self.data_layer.get_user_credential(
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type
        )

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
        credential = await self.data_layer.get_user_credential(
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type
        )
        return credential is not None and credential.is_active

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

    async def get_provider_implementation_status(self) -> Dict[str, Any]:
        """Get comprehensive provider implementation status"""
        return get_implementation_summary()

    async def is_provider_implemented(self, provider_id: str) -> bool:
        """Check if a provider is fully implemented"""
        return PROVIDER_IMPLEMENTATIONS.get(provider_id, {}).get("implemented", False)

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
        return await self.data_layer.delete_user_credential(
            user_id=user_id,
            provider_name=provider_name,
            provider_type=provider_type
        )