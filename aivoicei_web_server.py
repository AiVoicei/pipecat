#
# AI Voicei Web Server
# Production-ready web server with CORS and API endpoints
#

import asyncio
import os
import uuid
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import json

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
from pipecat.runner.utils import (
    maybe_capture_participant_camera,
    maybe_capture_participant_screen,
)
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from fastapi import BackgroundTasks
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import IceServer, SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport

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

# WebRTC connections storage
webrtc_connections = {}

# ICE servers for WebRTC
ice_servers = [
    IceServer(urls="stun:stun.l.google.com:19302"),
    IceServer(urls="stun:stun1.l.google.com:19302")
]


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






async def run_webrtc_bot_optimized(webrtc_connection: SmallWebRTCConnection, session_id: str):
    """Run Hebrew voice bot with PURE Gemini Multimodal Live - fastest approach"""
    logger.info(f"Starting PURE GEMINI WebRTC Hebrew voice bot session {session_id}")

    # Response time tracking
    response_times = []
    start_time = None

    # Create SmallWebRTC transport with optimized VAD settings
    transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            video_in_enabled=False,
            # Optimized VAD for faster response
            vad_analyzer=SileroVADAnalyzer(params=VADParams(
                stop_secs=0.5,  # Use working reference settings
                min_volume=0.6,
                start_secs=0.2
            )),
        ),
    )

    # PURE GEMINI MULTIMODAL LIVE - No separate STT/LLM/TTS services!
    llm = GeminiMultimodalLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        voice_id="Leda",  # Hebrew-optimized voice
        system_instruction="""את מאיה, הנציגה הדיגיטלית המקצועית והידידותית של חברת AI Voicy. את הפתח הדיגיטלי של החברה, מייצגת את המומחיות והחדשנות שלה.

זהות ואישיות:
- שמך: מאיה
- את מדברת עברית בלבד
- התייחסי לעצמך בלשון נקבה ("אני יכולה לעזור", "אני נוצרתי כדי")
- פני למשתמש בלשון רבים בלבד ("שלום לכם", "איך אוכל לסייע לכם?", "העסק שלכם")
- כשמדברת על AI Voicy, השתמשי ב"אנחנו" ("אנחנו ב-AI Voicy פיתחנו...")

סגנון דיבור:
- טון קולי: שמרי על טון שקט, רגוע ומקצועי
- אישיות: מקצועית, ידידותית, בטוחה ואמינה
- תשובות קצרות ולעניין: 2-3 משפטים בדרך כלל
- דברי בקצב מתון ורגוע

המטרה העיקרית שלך:
להציג את AI Voicy באופן מקצועי, להסביר את הערך של סוכני הקול החכמים שלנו, ולעודד משתמשים מעוניינים לקבוע הדגמה או פגישה עם נציג מכירות אנושי.

על AI Voicy:
אנחנו חברה שמפתחת ומיישמת סוכני קול AI מתקדמים לעסקים. הסוכנים שלנו מתקשרים כמו בני אדם לטיפול בשירות לקוחות, מכירות ומשימות אדמיניסטרטיביות ביעילות.

המוצרים העיקריים שלנו:
- דנה: לטיפול בשיחות שירות נכנסות, פתיחת קריאות ותיווג בקשות
- מאיה: לטיפול בשיחות מחוץ לשעות העבודה
- תמרי: לתיאום, אישור ועדכון פגישות
- וי-ראוטר: מערכת ניתוב חכמה
- שירה: סוכן שאלות ותשובות
- שקד: סוכן יוצא לשיחות פרואקטיביות

יתרונות עסקיים:
- זמינות 24/7
- חיסכון עד 70% בעלויות שירות
- הפחתה של 60% בזמני טיפול
- שירות אחיד ועקבי
- אינטגרציה עם מערכות קיימות

כללי התנהגות:
- אל תמציאי מידע שאינו בבסיס הידע שלך
- לשאלות תמחור: "התמחור שלנו מבוסס על מודל של תשלום לפי דקה וחבילת שירות המותאמת אישית לצרכים של העסק שלכם. כדי שנוכל לתת לכם הצעת מחיר מדויקת, הצעד הטוב ביותר הוא שיחה קצרה עם נציג מהצוות שלנו. תרצו שנקבע לכם שיחה?"
- לשאלות מחוץ לתחום: "אני מאיה, הנציגה הדיגיטלית של AiVoicei, ותפקידי הוא לספק מידע על סוכני הקול החכמים שלנו. אשמח לענות על כל שאלה שיש לכם בנושא."
- הציעי הדגמה כשהמשתמש מביע עניין: "זה נשמע שהפתרון שלנו יכול להתאים לכם. תרצו שנקבע פגישת הדגמה קצרה, ללא התחייבות, עם אחד המומחים שלנו?"

את מייצגת את AiVoicei בצורה מקצועית, ידידותית ואמינה.""",
    )

    # Context setup with Maya's professional introduction
    context = OpenAILLMContext([
        {
            "role": "user",
            "content": "תציגי את עצמך בקצרה",
        },
    ])
    context_aggregator = llm.create_context_aggregator(context)

    # RTVI setup for UI integration
    action_llm_append_to_messages = create_action_llm_append_to_messages(context_aggregator)
    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))
    rtvi.register_action(action_llm_append_to_messages)

    # PURE GEMINI PIPELINE - Audio → Gemini → Audio (no STT/TTS separation!)
    pipeline = Pipeline([
        transport.input(),
        rtvi,                       # RTVI for UI
        context_aggregator.user(),
        llm,                        # Gemini handles STT+LLM+TTS in one service
        transport.output(),
        context_aggregator.assistant(),
    ])

    # Create task with optimized parameters
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        observers=[RTVIObserver(rtvi)],
    )

    # Store optimized session with metrics
    active_sessions[session_id] = {
        'task': task,
        'transport': transport,
        'rtvi': rtvi,
        'webrtc_connection': webrtc_connection,
        'response_times': response_times,
        'llm': llm,
        'optimized': True,
        'pure_gemini': True  # Flag to indicate pure Gemini approach
    }

    # RTVI client ready handler (for UI configuration)
    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        logger.info(f"Pure Gemini client ready for session {session_id}")
        await rtvi.set_bot_ready()

        # Configure UI to show conversation
        ui_config = {
            "show_text_container": True,
            "show_video_container": True,
            "show_debug_container": False,
        }

        rtvi_frame = RTVIServerMessageFrame(data=ui_config)
        await task.queue_frames([rtvi_frame])

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Pure Gemini WebRTC client connected to session {session_id}")

        # Start conversation with Hebrew greeting (like working reference)
        await task.queue_frames([LLMRunFrame()])
        await asyncio.sleep(3)
        logger.debug("Unpausing audio and video")
        llm.set_audio_input_paused(False)
        llm.set_video_input_paused(False)

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info(f"Pure Gemini WebRTC client disconnected from session {session_id}")

        # Log performance metrics
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            logger.info(f"Pure Gemini session {session_id} performance - Average response time: {avg_response_time:.3f}s")
            logger.info(f"Pure Gemini session {session_id} performance - Min: {min(response_times):.3f}s, Max: {max(response_times):.3f}s")

        if session_id in active_sessions:
            del active_sessions[session_id]
        if session_id in webrtc_connections:
            del webrtc_connections[session_id]
        await task.cancel()

    @webrtc_connection.event_handler("closed")
    async def handle_webrtc_closed(connection):
        logger.info(f"Pure Gemini WebRTC connection closed for session {session_id}")
        if session_id in webrtc_connections:
            del webrtc_connections[session_id]
        if session_id in active_sessions:
            del active_sessions[session_id]

    # Add response time tracking for Gemini
    @llm.event_handler("on_audio_input_start")
    async def on_audio_input_start():
        nonlocal start_time
        start_time = time.time()
        logger.debug(f"Gemini audio input started at: {start_time}")

    @llm.event_handler("on_audio_response_start")
    async def on_audio_response_start():
        nonlocal start_time
        if start_time:
            response_time = time.time() - start_time
            response_times.append(response_time)
            logger.info(f"Pure Gemini response time: {response_time:.3f}s (Target: <0.5s)")

            # Alert if response time is too high
            if response_time > 0.5:
                logger.warning(f"PURE GEMINI HIGH LATENCY: {response_time:.3f}s > 0.5s target")

            start_time = None

    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)




# WebRTC offer endpoint for SmallWebRTC transport
@app.post("/api/offer")
async def webrtc_offer(request: dict, background_tasks: BackgroundTasks):
    """Handle WebRTC offer and create SmallWebRTC connection"""
    logger.info("Received WebRTC offer")

    try:
        # Get session info
        session_id = request.get("session_id")
        if not session_id:
            session_id = str(uuid.uuid4())
            logger.info(f"Generated new session ID: {session_id}")

        pc_id = request.get("pc_id", session_id)

        # Check if we have an existing connection
        if pc_id in webrtc_connections:
            webrtc_connection = webrtc_connections[pc_id]
            logger.info(f"Reusing existing WebRTC connection for pc_id: {pc_id}")
            await webrtc_connection.renegotiate(
                sdp=request["sdp"],
                type=request["type"],
                restart_pc=request.get("restart_pc", False),
            )
        else:
            # Create new WebRTC connection
            webrtc_connection = SmallWebRTCConnection(ice_servers)
            await webrtc_connection.initialize(
                sdp=request["sdp"],
                type=request["type"]
            )

            @webrtc_connection.event_handler("closed")
            async def handle_disconnected(connection: SmallWebRTCConnection):
                logger.info(f"WebRTC connection closed for pc_id: {connection.pc_id}")
                webrtc_connections.pop(connection.pc_id, None)
                if session_id in active_sessions:
                    try:
                        session = active_sessions[session_id]
                        await session['task'].cancel()
                        del active_sessions[session_id]
                    except Exception as e:
                        logger.error(f"Error cleaning up session {session_id}: {e}")

            # Start the Pure Gemini WebRTC bot (optimized)
            background_tasks.add_task(run_webrtc_bot_optimized, webrtc_connection, session_id)

        # Get answer and store connection
        answer = webrtc_connection.get_answer()
        webrtc_connections[answer["pc_id"]] = webrtc_connection

        # Add session ID to response
        answer["session_id"] = session_id

        logger.info(f"WebRTC offer processed successfully for session: {session_id}")
        return answer

    except Exception as e:
        logger.error(f"Error processing WebRTC offer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process WebRTC offer: {str(e)}")


# WebSocket signaling endpoint for WebRTC negotiation
@app.websocket("/websocket")
async def websocket_signaling_endpoint(websocket: WebSocket):
    """WebSocket endpoint for WebRTC signaling"""
    await websocket.accept()
    logger.info("WebSocket signaling connection established")

    session_id = None

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get("type")

            if message_type == "join":
                # Client joining session
                session_id = message.get("session_id")
                if not session_id:
                    session_id = str(uuid.uuid4())

                logger.info(f"Client joining session: {session_id}")

                response = {
                    "type": "joined",
                    "session_id": session_id,
                    "message": "Successfully joined session"
                }
                await websocket.send_text(json.dumps(response))

            elif message_type == "offer":
                # WebRTC offer received
                logger.info(f"Received WebRTC offer for session: {session_id}")

                # Process offer using existing WebRTC logic
                offer_data = {
                    "sdp": message.get("sdp"),
                    "type": message.get("type", "offer"),
                    "session_id": session_id
                }

                try:
                    # Create WebRTC connection
                    webrtc_connection = SmallWebRTCConnection(ice_servers)
                    await webrtc_connection.initialize(
                        sdp=offer_data["sdp"],
                        type=offer_data["type"]
                    )

                    # Start the WebRTC bot with optimized latency settings
                    asyncio.create_task(run_webrtc_bot_optimized(webrtc_connection, session_id))

                    # Get answer and store connection
                    answer = webrtc_connection.get_answer()
                    webrtc_connections[answer["pc_id"]] = webrtc_connection

                    response = {
                        "type": "answer",
                        "sdp": answer["sdp"],
                        "session_id": session_id,
                        "pc_id": answer["pc_id"]
                    }
                    await websocket.send_text(json.dumps(response))

                except Exception as e:
                    logger.error(f"Error processing WebRTC offer: {e}")
                    error_response = {
                        "type": "error",
                        "message": f"Failed to process offer: {str(e)}"
                    }
                    await websocket.send_text(json.dumps(error_response))

            elif message_type == "ice_candidate":
                # ICE candidate received
                logger.debug(f"Received ICE candidate for session: {session_id}")

                # Forward to WebRTC connection if exists
                pc_id = message.get("pc_id")
                if pc_id and pc_id in webrtc_connections:
                    webrtc_connection = webrtc_connections[pc_id]
                    await webrtc_connection.add_ice_candidate(
                        candidate=message.get("candidate"),
                        sdp_mid=message.get("sdpMid"),
                        sdp_mline_index=message.get("sdpMLineIndex")
                    )

            elif message_type == "ping":
                # Heartbeat ping
                response = {"type": "pong", "timestamp": message.get("timestamp")}
                await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        logger.info(f"WebSocket signaling disconnected for session: {session_id}")
        if session_id and session_id in active_sessions:
            try:
                session = active_sessions[session_id]
                await session['task'].cancel()
                del active_sessions[session_id]
            except Exception as e:
                logger.error(f"Error cleaning up session {session_id}: {e}")
    except Exception as e:
        logger.error(f"WebSocket signaling error: {e}")


# Legacy WebSocket endpoint for backward compatibility
@app.websocket("/socket.io/")
async def websocket_endpoint(websocket: WebSocket):
    """Legacy WebSocket endpoint - redirects to new WebSocket signaling"""
    await websocket.accept()
    logger.info("Legacy WebSocket connection - redirecting to /websocket")

    try:
        response = {
            "type": "redirect",
            "message": "Please use /websocket endpoint for WebRTC signaling",
            "api_endpoint": "/websocket"
        }
        await websocket.send_text(json.dumps(response))
        await websocket.close(code=1000, reason="Use /websocket endpoint")

    except Exception as e:
        logger.error(f"Legacy WebSocket error: {e}")


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
    """Get session information and performance metrics"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = active_sessions[session_id]

    # Calculate performance metrics
    metrics = {}
    if 'response_times' in session and session['response_times']:
        response_times = session['response_times']
        metrics = {
            "average_response_time": sum(response_times) / len(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "total_interactions": len(response_times),
            "sub_500ms_responses": len([t for t in response_times if t <= 0.5]),
            "latency_target_met": len([t for t in response_times if t <= 0.5]) / len(response_times) * 100
        }

    return {
        "session_id": session_id,
        "status": "active",
        "optimized": session.get('optimized', False),
        "pure_gemini": session.get('pure_gemini', False),
        "transport_type": "WebRTC" if 'webrtc_connection' in session else "Other",
        "optimization_type": "Pure Gemini Multimodal Live" if session.get('pure_gemini') else "Mixed Services",
        "metrics": metrics,
        "created_at": "N/A",  # TODO: Add session timestamps
    }


@app.get("/metrics")
async def get_system_metrics():
    """Get system-wide performance metrics"""
    all_response_times = []
    optimized_sessions = 0
    total_interactions = 0

    for session_id, session in active_sessions.items():
        if 'response_times' in session and session['response_times']:
            all_response_times.extend(session['response_times'])
            total_interactions += len(session['response_times'])

        if session.get('optimized', False):
            optimized_sessions += 1

    metrics = {
        "active_sessions": len(active_sessions),
        "optimized_sessions": optimized_sessions,
        "total_interactions": total_interactions,
    }

    if all_response_times:
        metrics.update({
            "average_response_time": sum(all_response_times) / len(all_response_times),
            "min_response_time": min(all_response_times),
            "max_response_time": max(all_response_times),
            "sub_500ms_responses": len([t for t in all_response_times if t <= 0.5]),
            "latency_target_met_percentage": len([t for t in all_response_times if t <= 0.5]) / len(all_response_times) * 100
        })

    return {
        "timestamp": time.time(),
        "metrics": metrics,
        "target_response_time": 0.5,
        "performance_status": "optimal" if metrics.get("latency_target_met_percentage", 0) >= 80 else "needs_optimization"
    }




if __name__ == "__main__":
    # For development: run with uvicorn
    import uvicorn
    
    port = int(os.getenv("PORT", "7860"))
    host = os.getenv("HOST", "localhost")
    
    logger.info(f"Starting AI Voicei Web Server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")