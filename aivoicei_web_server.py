#
# AI Voicei Web Server
# Production-ready web server with CORS and API endpoints
#

import asyncio
import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import (
    LLMMessagesAppendFrame,
    LLMRunFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import (
    ActionResult,
    RTVIAction,
    RTVIActionArgument,
    RTVIConfig,
    RTVIObserver,
    RTVIProcessor,
    RTVIServerMessageFrame,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import (
    create_transport,
    maybe_capture_participant_camera,
    maybe_capture_participant_screen,
)
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

load_dotenv(override=True)

# FastAPI app setup
app = FastAPI(
    title="AI Voicei API",
    description="Hebrew Voice AI Assistant API",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "https://aivoicei.com",   # Production domain
        "https://*.aivoicei.com", # Subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global bot state
active_sessions = {}


def create_action_llm_append_to_messages(context_aggregator):
    async def action_llm_append_to_messages_handler(
        rtvi: RTVIProcessor, service: str, arguments: dict[str, any]
    ) -> ActionResult:
        run_immediately = arguments["run_immediately"] if "run_immediately" in arguments else True

        if run_immediately:
            await rtvi.interrupt_bot()

            if "messages" in arguments and arguments["messages"]:
                frame = LLMMessagesAppendFrame(messages=arguments["messages"])
                await rtvi.push_frame(frame)

        if run_immediately:
            frame = LLMRunFrame()
            await rtvi.push_frame(frame)

        return True

    return RTVIAction(
        service="llm",
        action="append_to_messages", 
        result="bool",
        arguments=[
            RTVIActionArgument(name="messages", type="array"),
            RTVIActionArgument(name="run_immediately", type="bool"),
        ],
        handler=action_llm_append_to_messages_handler,
    )


transport_params = {
    "daily": lambda: DailyParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        video_in_enabled=True,
        vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
    ),
    "webrtc": lambda: TransportParams(
        audio_in_enabled=True,
        audio_out_enabled=True,
        video_in_enabled=True,
        vad_analyzer=SileroVADAnalyzer(params=VADParams(stop_secs=0.5)),
    ),
}


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments, session_id: str):
    logger.info(f"Starting Gemini Multimodal Live session {session_id}")

    # Gemini setup configured for Hebrew
    llm = GeminiMultimodalLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        voice_id="Puck",
        system_instruction="אתה עוזר מועיל שמדבר עברית בלבד. תמיד תענה בעברית ותהיה ידידותי ומועיל. אם מישהו מדבר איתך בשפה אחרת, תבקש ממנו לדבר עברית ותענה בעברית.",
    )

    # Context setup with Hebrew greeting
    context = OpenAILLMContext([
        {
            "role": "user",
            "content": "אמור שלום.",
        },
    ])
    context_aggregator = llm.create_context_aggregator(context)

    # RTVI setup
    action_llm_append_to_messages = create_action_llm_append_to_messages(context_aggregator)
    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))
    rtvi.register_action(action_llm_append_to_messages)

    # Pipeline
    pipeline = Pipeline([
        transport.input(),
        rtvi,
        context_aggregator.user(),
        llm,
        transport.output(),
        context_aggregator.assistant(),
    ])

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        idle_timeout_secs=runner_args.pipeline_idle_timeout_secs,
        observers=[RTVIObserver(rtvi)],
    )

    # Store session
    active_sessions[session_id] = {
        'task': task,
        'llm': llm,
        'rtvi': rtvi,
        'transport': transport
    }

    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info(f"Client ready for session {session_id}")
        await rtvi.set_bot_ready()

        ui_config = {
            "show_text_container": True,
            "show_video_container": True,
            "show_debug_container": False,
        }

        rtvi_frame = RTVIServerMessageFrame(data=ui_config)
        await task.queue_frames([rtvi_frame])

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected to session {session_id}: {client}")

        await maybe_capture_participant_camera(transport, client, framerate=1)
        await maybe_capture_participant_screen(transport, client, framerate=1)

        await task.queue_frames([LLMRunFrame()])
        await asyncio.sleep(3)
        logger.debug("Unpausing audio and video")
        llm.set_audio_input_paused(False)
        llm.set_video_input_paused(False)

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Client disconnected from session {session_id}")
        if session_id in active_sessions:
            del active_sessions[session_id]
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {"message": "AI Voicei API is running", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if required environment variables are set
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            raise HTTPException(status_code=503, detail="GOOGLE_API_KEY not configured")
        
        return {
            "status": "healthy",
            "service": "AI Voicei Hebrew Voice Assistant",
            "active_sessions": len(active_sessions),
            "environment": os.getenv("ENVIRONMENT", "development")
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.get("/status")
async def get_status():
    """Get server status and metrics"""
    return {
        "active_sessions": len(active_sessions),
        "sessions": list(active_sessions.keys()),
        "uptime": "N/A",  # TODO: Add uptime tracking
        "memory_usage": "N/A",  # TODO: Add memory monitoring
    }


@app.post("/sessions")
async def create_session():
    """Create a new voice session"""
    import uuid
    session_id = str(uuid.uuid4())
    
    return {
        "session_id": session_id,
        "status": "created",
        "message": "Session created successfully. Connect via WebRTC."
    }


@app.delete("/sessions/{session_id}")
async def end_session(session_id: str):
    """End a voice session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session = active_sessions[session_id]
        await session['task'].cancel()
        del active_sessions[session_id]
        
        return {
            "session_id": session_id,
            "status": "ended",
            "message": "Session ended successfully"
        }
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session information"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "status": "active",
        "created_at": "N/A",  # TODO: Add session timestamps
    }


# Bot entry point (for compatibility with existing runner)
async def bot(runner_args: RunnerArguments):
    """Main bot entry point compatible with Pipecat Cloud"""
    session_id = os.getenv("SESSION_ID", "default")
    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args, session_id)


if __name__ == "__main__":
    # For development: run with uvicorn
    import uvicorn
    
    port = int(os.getenv("PORT", "7860"))
    host = os.getenv("HOST", "localhost")
    
    logger.info(f"Starting AI Voicei Web Server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")