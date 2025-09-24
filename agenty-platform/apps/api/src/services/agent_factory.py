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
from pipecat.transports.daily.transport import DailyTransport
from pipecat.transports.local.audio import LocalAudioTransport
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.ai_service import AIService

# Import all available providers (these would be imported based on available extras)
from pipecat.services.openai import OpenAILLMService, OpenAITTSService
from pipecat.services.anthropic import AnthropicLLMService
from pipecat.services.deepgram import DeepgramSTTService, DeepgramTTSService
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.services.cartesia import CartesiaTTSService
from pipecat.services.azure import AzureSTTService, AzureTTSService, AzureLLMService

from ..schemas.agent import AgentConfiguration, AgentResponse, AgentSession
from ..schemas.provider import ProviderCredential
from .provider_service import ProviderService


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
            (config.stt.provider, "stt"),
            (config.llm.provider, "llm"),
            (config.tts.provider, "tts")
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
        """Create STT service based on configuration"""
        provider = stt_config["provider"]
        settings = stt_config.get("settings", {})

        # Get user credentials
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, "stt"
        )

        if provider == "openai":
            from pipecat.services.openai import OpenAISTTService
            return OpenAISTTService(
                api_key=credentials["api_key"],
                model=settings.get("model", "whisper-1"),
                language=settings.get("language", "en")
            )

        elif provider == "deepgram":
            return DeepgramSTTService(
                api_key=credentials["api_key"],
                model=settings.get("model", "nova-2"),
                language=settings.get("language", "en")
            )

        elif provider == "azure":
            return AzureSTTService(
                api_key=credentials["api_key"],
                region=credentials["region"],
                language=settings.get("language", "en-US")
            )

        # Add more providers as needed
        else:
            raise ValueError(f"Unsupported STT provider: {provider}")

    async def _create_llm_service(self, llm_config: Dict[str, Any], user_id: str) -> AIService:
        """Create LLM service based on configuration"""
        provider = llm_config["provider"]
        settings = llm_config.get("settings", {})

        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, "llm"
        )

        if provider == "openai":
            return OpenAILLMService(
                api_key=credentials["api_key"],
                model=settings.get("model", "gpt-4"),
                max_tokens=settings.get("max_tokens", 150),
                temperature=settings.get("temperature", 0.7)
            )

        elif provider == "anthropic":
            return AnthropicLLMService(
                api_key=credentials["api_key"],
                model=settings.get("model", "claude-3-sonnet-20240229"),
                max_tokens=settings.get("max_tokens", 150)
            )

        elif provider == "azure":
            return AzureLLMService(
                api_key=credentials["api_key"],
                endpoint=credentials["endpoint"],
                model=settings.get("model", "gpt-4"),
                api_version=credentials.get("api_version", "2024-02-01")
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    async def _create_tts_service(self, tts_config: Dict[str, Any], user_id: str) -> AIService:
        """Create TTS service based on configuration"""
        provider = tts_config["provider"]
        settings = tts_config.get("settings", {})

        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, "tts"
        )

        if provider == "elevenlabs":
            return ElevenLabsTTSService(
                api_key=credentials["api_key"],
                voice_id=settings.get("voice_id", "21m00Tcm4TlvDq8ikWAM"),
                stability=settings.get("stability", 0.5),
                similarity_boost=settings.get("similarity_boost", 0.8)
            )

        elif provider == "cartesia":
            return CartesiaTTSService(
                api_key=credentials["api_key"],
                voice_id=settings.get("voice_id", "a0e99841-438c-4a64-b679-ae501e7d6091"),
                model_id=settings.get("model_id", "sonic-english")
            )

        elif provider == "azure":
            return AzureTTSService(
                api_key=credentials["api_key"],
                region=credentials["region"],
                voice=settings.get("voice", "en-US-AriaNeural")
            )

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