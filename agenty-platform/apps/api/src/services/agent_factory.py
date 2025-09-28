"""
AgentFactory - Dynamic agent creation and pipeline generation service.
This service creates Pipecat pipelines dynamically based on agent configurations.
"""

import asyncio
import json
import os
import uuid
from typing import Dict, Any, Optional, List, Type
from datetime import datetime

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask

from ..schemas.agent import ProviderType
from pipecat.transports.daily.transport import DailyTransport
from pipecat.transports.local.audio import LocalAudioTransport
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.ai_service import AIService

# Import providers dynamically to avoid missing dependency errors
# Provider services will be imported only when needed

from schemas.agent import AgentConfiguration, AgentResponse, AgentSession
from schemas.provider import ProviderCredential
from services.provider_service import ProviderService
from services.provider_implementations import PROVIDER_IMPLEMENTATIONS, ProviderImplementationInfo


class AgentFactory:
    """Factory for creating and managing dynamic Pipecat agents"""

    def __init__(self, provider_service: ProviderService):
        self.provider_service = provider_service
        self.active_agents: Dict[str, Dict[str, Any]] = {}
        self.agent_sessions: Dict[str, AgentSession] = {}

    async def create_agent(
        self,
        agent_config: AgentConfiguration,
        user_id: str,
        agent_id: str
    ) -> Dict[str, Any]:
        """
        Create a new agent instance with the given configuration

        Args:
            agent_config: Agent configuration schema
            user_id: User ID for credential access
            agent_id: Unique agent identifier

        Returns:
            Dict containing agent instance information
        """
        try:
            # Validate configuration
            await self._validate_configuration(agent_config, user_id)

            # Create services
            stt_service = await self._create_stt_service(agent_config.stt, user_id)
            llm_service = await self._create_llm_service(agent_config.llm, user_id)
            tts_service = await self._create_tts_service(agent_config.tts, user_id)

            # Create transport
            transport = await self._create_transport(agent_config.transport)

            # Create pipeline
            pipeline = await self._create_pipeline(
                stt_service, llm_service, tts_service, transport, agent_config
            )

            # Create agent session
            session = AgentSession(
                id=str(uuid.uuid4()),
                agent_id=agent_id,
                session_uuid=str(uuid.uuid4()),
                status="starting",
                started_at=datetime.now(),
                metadata={
                    "user_id": user_id,
                    "configuration": agent_config.dict()
                }
            )

            # Store agent instance
            agent_instance = {
                "id": agent_id,
                "session": session,
                "pipeline": pipeline,
                "transport": transport,
                "configuration": agent_config,
                "status": "created"
            }

            self.active_agents[agent_id] = agent_instance
            self.agent_sessions[session.session_uuid] = session

            return agent_instance

        except Exception as e:
            raise Exception(f"Failed to create agent: {str(e)}")

    async def start_agent(self, agent_id: str) -> bool:
        """Start an agent instance"""
        if agent_id not in self.active_agents:
            raise ValueError(f"Agent {agent_id} not found")

        try:
            agent = self.active_agents[agent_id]

            # Update session status
            session = agent["session"]
            session.status = "starting"

            # Start the pipeline
            runner = PipelineRunner()
            task = PipelineTask(agent["pipeline"])

            # Start in background
            asyncio.create_task(runner.run(task))

            # Update status
            agent["status"] = "running"
            session.status = "running"

            return True

        except Exception as e:
            agent = self.active_agents[agent_id]
            agent["status"] = "error"
            agent["session"].status = "error"
            raise Exception(f"Failed to start agent: {str(e)}")

    async def stop_agent(self, agent_id: str) -> bool:
        """Stop an agent instance"""
        if agent_id not in self.active_agents:
            return False

        try:
            agent = self.active_agents[agent_id]

            # Update session
            session = agent["session"]
            session.status = "stopping"
            session.ended_at = datetime.now()

            # Stop transport
            if "transport" in agent and agent["transport"]:
                await agent["transport"].stop()

            # Update status
            agent["status"] = "stopped"
            session.status = "stopped"

            # Clean up
            del self.active_agents[agent_id]

            return True

        except Exception as e:
            raise Exception(f"Failed to stop agent: {str(e)}")

    async def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of an agent"""
        if agent_id not in self.active_agents:
            return None

        agent = self.active_agents[agent_id]
        return {
            "id": agent_id,
            "status": agent["status"],
            "session": agent["session"].dict(),
            "uptime": (datetime.now() - agent["session"].started_at).total_seconds()
        }

    async def _validate_configuration(self, config: AgentConfiguration, user_id: str):
        """Validate agent configuration and user credentials"""
        # Check if user has credentials for all required providers
        providers_needed = [
            (config.stt.provider, ProviderType.STT),
            (config.llm.provider, ProviderType.LLM),
            (config.tts.provider, ProviderType.TTS)
        ]

        for provider_name, provider_type in providers_needed:
            has_creds = await self.provider_service.user_has_credentials(
                user_id, provider_name, provider_type
            )
            if not has_creds:
                raise ValueError(
                    f"User missing credentials for {provider_type} provider: {provider_name}"
                )

    async def _create_stt_service(self, stt_config: Dict[str, Any], user_id: str) -> AIService:
        """Create STT service based on configuration with comprehensive provider support"""
        provider = stt_config["provider"]
        settings = stt_config.get("settings", {})

        # Check implementation status
        provider_key = f"{provider}_stt" if provider != "deepgram" else provider
        impl_info = PROVIDER_IMPLEMENTATIONS.get(provider_key)

        if not impl_info:
            raise ValueError(f"Unknown STT provider: {provider}")

        if not impl_info.implemented and not impl_info.mock_fallback:
            raise ValueError(f"STT provider {provider} is not yet implemented")

        # Get user credentials
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, ProviderType.STT
        )

        # Fully implemented providers
        if provider == "openai":
            try:
                from pipecat.services.openai.stt import OpenAISTTService
                return OpenAISTTService(
                    api_key=credentials.api_key,
                    model=settings.get("model", "whisper-1"),
                    language=settings.get("language", "en")
                )
            except ImportError:
                raise ValueError(f"OpenAI STT service not available - install with: pip install pipecat-ai[openai]")

        elif provider == "deepgram":
            try:
                from pipecat.services.deepgram.stt import DeepgramSTTService
                return DeepgramSTTService(
                    api_key=credentials.api_key,
                    model=settings.get("model", "nova-2"),
                    language=settings.get("language", "en")
                )
            except ImportError:
                raise ValueError(f"Deepgram STT service not available - install with: pip install pipecat-ai[deepgram]")

        elif provider == "azure":
            try:
                from pipecat.services.azure.stt import AzureSTTService
                return AzureSTTService(
                    api_key=credentials.api_key,
                    region=credentials.region,
                    language=settings.get("language", "en-US")
                )
            except ImportError:
                raise ValueError(f"Azure STT service not available - install with: pip install pipecat-ai[azure]")

        # Providers available in Pipecat but not yet fully integrated in Agenty
        elif provider == "google":
            # Mock implementation - would use actual GoogleSTTService
            return self._create_mock_stt_service(provider, settings)

        elif provider == "assemblyai":
            # Mock implementation - would use actual AssemblyAISTTService
            return self._create_mock_stt_service(provider, settings)

        elif provider == "groq":
            # Mock implementation - would use actual GroqSTTService
            return self._create_mock_stt_service(provider, settings)

        else:
            # For all other providers, use mock implementation
            if impl_info.mock_fallback:
                return self._create_mock_stt_service(provider, settings)
            else:
                raise ValueError(f"Unsupported STT provider: {provider}")

    async def _create_llm_service(self, llm_config: Dict[str, Any], user_id: str) -> AIService:
        """Create LLM service based on configuration"""
        provider = llm_config["provider"]
        settings = llm_config.get("settings", {})

        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, ProviderType.LLM
        )

        if provider == "openai":
            try:
                from pipecat.services.openai.llm import OpenAILLMService
                return OpenAILLMService(
                    api_key=credentials.api_key,
                    model=settings.get("model", "gpt-4"),
                    max_tokens=settings.get("max_tokens", 150),
                    temperature=settings.get("temperature", 0.7)
                )
            except ImportError:
                raise ValueError(f"OpenAI LLM service not available - install with: pip install pipecat-ai[openai]")

        elif provider == "anthropic":
            try:
                from pipecat.services.anthropic.llm import AnthropicLLMService
                return AnthropicLLMService(
                    api_key=credentials.api_key,
                    model=settings.get("model", "claude-3-sonnet-20240229"),
                    max_tokens=settings.get("max_tokens", 150)
                )
            except ImportError:
                raise ValueError(f"Anthropic LLM service not available - install with: pip install pipecat-ai[anthropic]")

        elif provider == "azure":
            try:
                from pipecat.services.azure.llm import AzureLLMService
                return AzureLLMService(
                    api_key=credentials.api_key,
                    endpoint=credentials.endpoint,
                    model=settings.get("model", "gpt-4"),
                    api_version=getattr(credentials, "api_version", "2024-02-01")
                )
            except ImportError:
                raise ValueError(f"Azure LLM service not available - install with: pip install pipecat-ai[azure]")

        elif provider == "google":
            # Mock implementation - would use actual GoogleLLMService
            return self._create_mock_llm_service(provider, settings)

        elif provider == "groq":
            # Mock implementation - would use actual GroqLLMService
            return self._create_mock_llm_service(provider, settings)

        else:
            # Check if provider has mock fallback
            provider_key = f"{provider}_llm"
            impl_info = PROVIDER_IMPLEMENTATIONS.get(provider_key)
            if impl_info and impl_info.mock_fallback:
                return self._create_mock_llm_service(provider, settings)
            else:
                raise ValueError(f"Unsupported LLM provider: {provider}")

    async def _create_tts_service(self, tts_config: Dict[str, Any], user_id: str) -> AIService:
        """Create TTS service based on configuration"""
        provider = tts_config["provider"]
        settings = tts_config.get("settings", {})

        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, ProviderType.TTS
        )

        if provider == "elevenlabs":
            try:
                from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
                return ElevenLabsTTSService(
                    api_key=credentials.api_key,
                    voice_id=settings.get("voice_id", "21m00Tcm4TlvDq8ikWAM"),
                    stability=settings.get("stability", 0.5),
                    similarity_boost=settings.get("similarity_boost", 0.8)
                )
            except ImportError:
                raise ValueError(f"ElevenLabs TTS service not available - install with: pip install pipecat-ai[elevenlabs]")

        elif provider == "cartesia":
            try:
                from pipecat.services.cartesia.tts import CartesiaTTSService
                return CartesiaTTSService(
                    api_key=credentials.api_key,
                    voice_id=settings.get("voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091"),
                    model_id=settings.get("model_id", "sonic-english")
                )
            except ImportError:
                raise ValueError(f"Cartesia TTS service not available - install with: pip install pipecat-ai[cartesia]")

        elif provider == "azure":
            try:
                from pipecat.services.azure.tts import AzureTTSService
                return AzureTTSService(
                    api_key=credentials.api_key,
                    region=credentials.region,
                    voice=settings.get("voice", "en-US-AriaNeural")
                )
            except ImportError:
                raise ValueError(f"Azure TTS service not available - install with: pip install pipecat-ai[azure]")

        elif provider == "google":
            # Mock implementation - would use actual GoogleTTSService
            return self._create_mock_tts_service(provider, settings)

        elif provider == "playht":
            # Mock implementation - would use actual PlayHTTTSService
            return self._create_mock_tts_service(provider, settings)

        else:
            # Check if provider has mock fallback
            provider_key = f"{provider}_tts" if provider not in ["elevenlabs", "cartesia"] else provider
            impl_info = PROVIDER_IMPLEMENTATIONS.get(provider_key)
            if impl_info and impl_info.mock_fallback:
                return self._create_mock_tts_service(provider, settings)
            else:
                raise ValueError(f"Unsupported TTS provider: {provider}")

    async def _create_transport(self, transport_config: Dict[str, Any]):
        """Create transport based on configuration"""
        transport_type = transport_config["type"]
        settings = transport_config.get("settings", {})

        if transport_type == "webrtc":
            # For WebRTC, we'll use Daily transport (this would be configured)
            return DailyTransport(
                room_url=settings.get("room_url"),
                token=settings.get("token"),
                bot_name=settings.get("bot_name", "Agent"),
                audio_in_enabled=settings.get("audio_in_enabled", True),
                audio_out_enabled=settings.get("audio_out_enabled", True)
            )

        elif transport_type == "websocket":
            # Local audio transport for testing
            return LocalAudioTransport(
                audio_in_enabled=settings.get("audio_in_enabled", True),
                audio_out_enabled=settings.get("audio_out_enabled", True)
            )

        else:
            raise ValueError(f"Unsupported transport type: {transport_type}")

    async def _create_pipeline(
        self,
        stt_service: AIService,
        llm_service: AIService,
        tts_service: AIService,
        transport,
        config: AgentConfiguration
    ) -> Pipeline:
        """Create Pipecat pipeline with all services"""

        # Create LLM context
        context = LLMContext()

        # Add system prompt if provided
        if config.system_prompt:
            context.add_message({
                "role": "system",
                "content": config.system_prompt
            })

        # Create VAD if enabled
        vad = None
        if config.vad_enabled:
            vad = SileroVADAnalyzer()

        # Create pipeline
        pipeline = Pipeline([
            transport.input_processor(),
            stt_service,
            context,
            llm_service,
            tts_service,
            transport.output_processor()
        ])

        return pipeline

    def get_active_agents(self) -> List[Dict[str, Any]]:
        """Get list of all active agents"""
        return [
            {
                "id": agent_id,
                "status": agent["status"],
                "session_uuid": agent["session"].session_uuid,
                "started_at": agent["session"].started_at,
                "configuration": agent["configuration"].dict()
            }
            for agent_id, agent in self.active_agents.items()
        ]

    async def cleanup_inactive_agents(self, max_idle_minutes: int = 30):
        """Clean up agents that have been inactive"""
        cutoff_time = datetime.now().timestamp() - (max_idle_minutes * 60)

        agents_to_remove = []
        for agent_id, agent in self.active_agents.items():
            if agent["session"].started_at.timestamp() < cutoff_time:
                agents_to_remove.append(agent_id)

        for agent_id in agents_to_remove:
            await self.stop_agent(agent_id)

    def _create_mock_stt_service(self, provider: str, settings: Dict[str, Any]) -> AIService:
        """Create mock STT service for providers not yet fully implemented"""
        # This would return a MockSTTService that simulates the provider
        # For now, we'll return a basic OpenAI service as fallback
        # TODO: Implement proper mock services for each provider
        try:
            from pipecat.services.openai.stt import OpenAISTTService
            return OpenAISTTService(
                api_key="mock_key_for_development",
                model="whisper-1"
            )
        except ImportError:
            # Return a simple mock service if OpenAI isn't available
            from pipecat.services.ai_service import AIService
            return AIService()  # Basic mock service

    def _create_mock_llm_service(self, provider: str, settings: Dict[str, Any]) -> AIService:
        """Create mock LLM service for providers not yet fully implemented"""
        # This would return a MockLLMService that simulates the provider
        # For now, we'll return a basic OpenAI service as fallback
        try:
            from pipecat.services.openai.llm import OpenAILLMService
            return OpenAILLMService(
                api_key="mock_key_for_development",
                model="gpt-3.5-turbo"
            )
        except ImportError:
            # Return a simple mock service if OpenAI isn't available
            from pipecat.services.ai_service import AIService
            return AIService()  # Basic mock service

    def _create_mock_tts_service(self, provider: str, settings: Dict[str, Any]) -> AIService:
        """Create mock TTS service for providers not yet fully implemented"""
        # This would return a MockTTSService that simulates the provider
        # For now, we'll return a basic service as fallback
        try:
            from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
            return ElevenLabsTTSService(
                api_key="mock_key_for_development",
                voice_id="21m00Tcm4TlvDq8ikWAM"
            )
        except ImportError:
            # Return a simple mock service if ElevenLabs isn't available
            from pipecat.services.ai_service import AIService
            return AIService()  # Basic mock service