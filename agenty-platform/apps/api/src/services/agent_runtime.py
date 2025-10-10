"""
Dynamic Agent Runtime - Creates and runs Pipecat pipelines from saved agent configurations

This module handles the runtime execution of agents created through the pipeline builder.
It converts saved agent configurations into executable Pipecat pipelines and manages
their lifecycle during testing and deployment.
"""

import asyncio
import os
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from loguru import logger

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.transcript_processor import TranscriptProcessor
from pipecat.processors.frameworks.rtvi import RTVIProcessor, RTVIConfig, RTVIObserver
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import LLMRunFrame
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection


class AgentRuntime:
    """Manages runtime execution of agents from pipeline configurations"""

    def __init__(self, provider_service):
        """
        Initialize agent runtime

        Args:
            provider_service: Service for accessing provider credentials
        """
        self.provider_service = provider_service
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    async def create_agent_pipeline(
        self,
        agent_config: Dict[str, Any],
        webrtc_connection: SmallWebRTCConnection,
        session_id: str
    ) -> PipelineTask:
        """
        Create executable Pipecat pipeline from agent configuration

        Args:
            agent_config: Agent configuration from database
            webrtc_connection: WebRTC connection for transport
            session_id: Unique session identifier

        Returns:
            PipelineTask ready to execute
        """
        logger.info(f"Creating pipeline for agent: {agent_config.get('name', 'Unknown')} (session: {session_id})")

        pipeline_type = agent_config.get('pipeline_type', 'traditional')

        if pipeline_type == 'realtime':
            return await self._create_realtime_pipeline(
                agent_config, webrtc_connection, session_id
            )
        else:
            return await self._create_traditional_pipeline(
                agent_config, webrtc_connection, session_id
            )

    async def _create_realtime_pipeline(
        self,
        agent_config: Dict[str, Any],
        webrtc_connection: SmallWebRTCConnection,
        session_id: str
    ) -> PipelineTask:
        """Create pipeline for realtime providers (OpenAI Realtime, Gemini Live)"""

        realtime_config = agent_config.get('realtime', {})
        provider = realtime_config.get('provider', '')
        settings = realtime_config.get('settings', {})

        logger.info(f"Creating realtime pipeline with provider: {provider}")

        # Create transport with video support for multimodal
        transport = SmallWebRTCTransport(
            webrtc_connection=webrtc_connection,
            params=TransportParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                video_in_enabled=True,  # Enable for multimodal realtime
                vad_analyzer=SileroVADAnalyzer(params=VADParams(
                    stop_secs=0.5,
                    min_volume=0.6,
                    start_secs=0.2
                )),
            ),
        )

        # Get credentials from provider service
        user_id = agent_config.get('userId', agent_config.get('user_id', 'user_1'))
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, 'REALTIME'
        )

        # Create realtime service based on provider
        if provider == 'openai-realtime' or provider == 'openai_realtime':
            from pipecat.services.openai_realtime.openai import OpenAIRealtimeService
            llm = OpenAIRealtimeService(
                api_key=credentials.api_key,
                model=settings.get('model', 'gpt-4o-realtime-preview'),
                voice=settings.get('voice', 'alloy')
            )
        elif provider == 'gemini-live' or provider == 'gemini_live':
            from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
            llm = GeminiMultimodalLiveLLMService(
                api_key=credentials.api_key,
                voice_id=settings.get('voice_id', 'Leda'),
                system_instruction=agent_config.get('system_prompt', 'You are a helpful AI assistant.')
            )
        else:
            raise ValueError(f"Unsupported realtime provider: {provider}")

        # Create context
        system_prompt = agent_config.get('system_prompt', 'You are a helpful AI assistant.')
        messages = [{"role": "user", "content": "Please introduce yourself briefly."}]
        context = OpenAILLMContext(messages)
        context_aggregator = llm.create_context_aggregator(context)

        # Create RTVI processor
        rtvi = RTVIProcessor(
            config=RTVIConfig(config=[]),
            transcription_events=True,
            performance_metrics=True
        )

        # Create transcript processor
        transcript = TranscriptProcessor()

        # Build pipeline
        pipeline = Pipeline([
            transport.input(),
            rtvi,
            transcript.user(),
            context_aggregator.user(),
            llm,
            transcript.assistant(),
            transport.output(),
            context_aggregator.assistant(),
        ])

        # Create task
        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
            observers=[RTVIObserver(rtvi)],
        )

        # Store session data
        self.active_sessions[session_id] = {
            'agent_id': agent_config.get('id'),
            'task': task,
            'transport': transport,
            'llm': llm,
            'rtvi': rtvi,
            'transcript': transcript,
            'pipeline_type': 'realtime',
            'provider': provider,
            'start_time': datetime.now()
        }

        # Setup event handlers
        await self._setup_realtime_events(transport, task, llm, session_id)

        return task

    async def _create_traditional_pipeline(
        self,
        agent_config: Dict[str, Any],
        webrtc_connection: SmallWebRTCConnection,
        session_id: str
    ) -> PipelineTask:
        """Create pipeline for traditional STT → LLM → TTS flow"""

        stt_config = agent_config.get('stt', {})
        llm_config = agent_config.get('llm', {})
        tts_config = agent_config.get('tts', {})

        logger.info(f"Creating traditional pipeline: {stt_config.get('provider')} → {llm_config.get('provider')} → {tts_config.get('provider')}")

        # Create transport with VAD
        transport = SmallWebRTCTransport(
            webrtc_connection=webrtc_connection,
            params=TransportParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
                video_in_enabled=False,  # Traditional pipelines don't use video
                vad_analyzer=SileroVADAnalyzer(params=VADParams(
                    stop_secs=0.5,
                    min_volume=0.6,
                    start_secs=0.2
                )),
            ),
        )

        # Get user ID
        user_id = agent_config.get('userId', agent_config.get('user_id', 'user_1'))

        # Create STT service
        stt = await self._create_stt_service(stt_config, user_id)

        # Create LLM service
        llm = await self._create_llm_service(llm_config, user_id)

        # Create TTS service
        tts = await self._create_tts_service(tts_config, user_id)

        # Create context
        system_prompt = agent_config.get('system_prompt', 'You are a helpful AI assistant.')
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": "Please introduce yourself briefly."}
        ]

        # Choose context based on LLM provider
        if llm_config.get('provider') in ['openai', 'azure-openai', 'azure_openai']:
            context = OpenAILLMContext(messages)
        else:
            context = LLMContext(messages)

        context_aggregator = llm.create_context_aggregator(context)

        # Create RTVI processor
        rtvi = RTVIProcessor(
            config=RTVIConfig(config=[]),
            transcription_events=True,
            performance_metrics=True
        )

        # Create transcript processor
        transcript = TranscriptProcessor()

        # Build pipeline with optional filters/aggregators
        pipeline_components = [
            transport.input(),
            stt,
            rtvi,
            transcript.user(),
            context_aggregator.user(),
        ]

        # Add filters before LLM if configured
        filters_config = agent_config.get('filters', [])
        before_llm_filters = [f for f in filters_config if f.get('position') == 'before_llm']
        for filter_cfg in before_llm_filters:
            filter_processor = self._create_filter(filter_cfg)
            if filter_processor:
                pipeline_components.append(filter_processor)

        # Add LLM
        pipeline_components.append(llm)

        # Add filters after LLM if configured
        after_llm_filters = [f for f in filters_config if f.get('position') == 'after_llm']
        for filter_cfg in after_llm_filters:
            filter_processor = self._create_filter(filter_cfg)
            if filter_processor:
                pipeline_components.append(filter_processor)

        # Add TTS and output
        pipeline_components.extend([
            tts,
            transcript.assistant(),
            transport.output(),
            context_aggregator.assistant(),
        ])

        # Create pipeline
        pipeline = Pipeline(pipeline_components)

        # Create task
        task = PipelineTask(
            pipeline,
            params=PipelineParams(
                enable_metrics=True,
                enable_usage_metrics=True,
            ),
            observers=[RTVIObserver(rtvi)],
        )

        # Store session data
        self.active_sessions[session_id] = {
            'agent_id': agent_config.get('id'),
            'task': task,
            'transport': transport,
            'stt': stt,
            'llm': llm,
            'tts': tts,
            'rtvi': rtvi,
            'transcript': transcript,
            'pipeline_type': 'traditional',
            'providers': {
                'stt': stt_config.get('provider'),
                'llm': llm_config.get('provider'),
                'tts': tts_config.get('provider'),
            },
            'start_time': datetime.now()
        }

        # Setup event handlers
        await self._setup_traditional_events(transport, task, session_id)

        return task

    async def _create_stt_service(self, stt_config: Dict[str, Any], user_id: str):
        """Create STT service from configuration"""
        provider = stt_config.get('provider', '')
        settings = stt_config.get('settings', {})

        # Get credentials
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, 'STT'
        )

        if provider == 'deepgram':
            from pipecat.services.deepgram.stt import DeepgramSTTService
            return DeepgramSTTService(
                api_key=credentials.api_key,
                model=settings.get('model', 'nova-2'),
                language=settings.get('language', 'en')
            )
        elif provider == 'openai' or provider == 'openai-whisper':
            from pipecat.services.openai.stt import OpenAISTTService
            return OpenAISTTService(
                api_key=credentials.api_key,
                model=settings.get('model', 'whisper-1'),
                language=settings.get('language', 'en')
            )
        elif provider == 'azure' or provider == 'azure-stt':
            from pipecat.services.azure.stt import AzureSTTService
            return AzureSTTService(
                api_key=credentials.api_key,
                region=credentials.region,
                language=settings.get('language', 'en-US')
            )
        else:
            raise ValueError(f"Unsupported STT provider: {provider}")

    async def _create_llm_service(self, llm_config: Dict[str, Any], user_id: str):
        """Create LLM service from configuration"""
        provider = llm_config.get('provider', '')
        settings = llm_config.get('settings', {})

        # Get credentials
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, 'LLM'
        )

        if provider == 'openai':
            from pipecat.services.openai.llm import OpenAILLMService
            return OpenAILLMService(
                api_key=credentials.api_key,
                model=settings.get('model', 'gpt-4'),
                temperature=settings.get('temperature', 0.7),
                max_tokens=settings.get('max_tokens', settings.get('maxTokens', 1000))
            )
        elif provider == 'anthropic':
            from pipecat.services.anthropic.llm import AnthropicLLMService
            return AnthropicLLMService(
                api_key=credentials.api_key,
                model=settings.get('model', 'claude-3-sonnet-20240229'),
                max_tokens=settings.get('max_tokens', settings.get('maxTokens', 1000))
            )
        elif provider == 'azure' or provider == 'azure-openai':
            from pipecat.services.azure.llm import AzureLLMService
            return AzureLLMService(
                api_key=credentials.api_key,
                endpoint=credentials.endpoint,
                model=settings.get('model', 'gpt-4'),
                api_version=getattr(credentials, 'api_version', '2024-02-01')
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    async def _create_tts_service(self, tts_config: Dict[str, Any], user_id: str):
        """Create TTS service from configuration"""
        provider = tts_config.get('provider', '')
        settings = tts_config.get('settings', {})

        # Get credentials
        credentials = await self.provider_service.get_user_credentials(
            user_id, provider, 'TTS'
        )

        if provider == 'elevenlabs':
            from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
            return ElevenLabsTTSService(
                api_key=credentials.api_key,
                voice_id=settings.get('voice_id', settings.get('voice', '21m00Tcm4TlvDq8ikWAM')),
                stability=settings.get('stability', 0.5),
                similarity_boost=settings.get('similarity_boost', 0.8)
            )
        elif provider == 'cartesia':
            from pipecat.services.cartesia.tts import CartesiaTTSService
            return CartesiaTTSService(
                api_key=credentials.api_key,
                voice_id=settings.get('voice_id', settings.get('voice', 'a0e99841-438c-4a64-b679-ae501e7d6091')),
                model_id=settings.get('model_id', 'sonic-english')
            )
        elif provider == 'azure' or provider == 'azure-tts':
            from pipecat.services.azure.tts import AzureTTSService
            return AzureTTSService(
                api_key=credentials.api_key,
                region=credentials.region,
                voice=settings.get('voice', 'en-US-AriaNeural')
            )
        elif provider == 'openai' or provider == 'openai-tts':
            from pipecat.services.openai.tts import OpenAITTSService
            return OpenAITTSService(
                api_key=credentials.api_key,
                voice=settings.get('voice', 'alloy')
            )
        else:
            raise ValueError(f"Unsupported TTS provider: {provider}")

    def _create_filter(self, filter_config: Dict[str, Any]):
        """Create filter processor from configuration"""
        filter_type = filter_config.get('type', '')
        logger.info(f"Filter type '{filter_type}' not yet implemented, skipping")
        return None  # TODO: Implement specific filter types

    async def _setup_realtime_events(self, transport, task, llm, session_id: str):
        """Setup event handlers for realtime pipeline"""

        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            logger.info(f"Client connected to realtime session {session_id}")
            # Start conversation
            await task.queue_frames([LLMRunFrame()])
            await asyncio.sleep(3)
            llm.set_audio_input_paused(False)
            llm.set_video_input_paused(True)  # Keep video paused by default

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            logger.info(f"Client disconnected from realtime session {session_id}")
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            await task.cancel()

    async def _setup_traditional_events(self, transport, task, session_id: str):
        """Setup event handlers for traditional pipeline"""

        @transport.event_handler("on_client_connected")
        async def on_client_connected(transport, client):
            logger.info(f"Client connected to traditional session {session_id}")
            # Start conversation
            await task.queue_frames([LLMRunFrame()])

        @transport.event_handler("on_client_disconnected")
        async def on_client_disconnected(transport, client):
            logger.info(f"Client disconnected from traditional session {session_id}")
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            await task.cancel()

    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get information about an active session"""
        if session_id not in self.active_sessions:
            return None

        session = self.active_sessions[session_id]
        uptime = (datetime.now() - session['start_time']).total_seconds()

        return {
            'session_id': session_id,
            'agent_id': session.get('agent_id'),
            'pipeline_type': session.get('pipeline_type'),
            'provider': session.get('provider') or session.get('providers'),
            'uptime_seconds': uptime,
            'status': 'active'
        }

    async def cleanup_session(self, session_id: str):
        """Clean up a session"""
        if session_id not in self.active_sessions:
            return

        session = self.active_sessions[session_id]

        try:
            # Cancel task
            if 'task' in session:
                await session['task'].cancel()

            # Stop transport
            if 'transport' in session:
                await session['transport'].stop()

            # Remove from active sessions
            del self.active_sessions[session_id]

            logger.info(f"Cleaned up session {session_id}")
        except Exception as e:
            logger.error(f"Error cleaning up session {session_id}: {e}")
