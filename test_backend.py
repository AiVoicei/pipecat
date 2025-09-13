#!/usr/bin/env python3

"""
Simple test backend for AI Voicei WebRTC integration
This is a minimal FastAPI server to test the frontend WebRTC functionality
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Voicei Test Backend", version="1.0.0")

# CORS configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage
sessions = {}

class SessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: str

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "AI Voicei Test Backend is running",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/sessions")
async def create_session():
    """Create a new voice session"""
    try:
        session_id = str(uuid.uuid4())
        session_data = {
            "id": session_id,
            "status": "created",
            "created_at": datetime.now().isoformat()
        }
        sessions[session_id] = session_data

        logger.info(f"Created session: {session_id}")

        return SessionResponse(
            session_id=session_id,
            status="created",
            created_at=session_data["created_at"]
        )
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@app.delete("/sessions/{session_id}")
async def end_session(session_id: str):
    """End a voice session"""
    try:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        sessions[session_id]["status"] = "ended"
        sessions[session_id]["ended_at"] = datetime.now().isoformat()

        logger.info(f"Ended session: {session_id}")

        return {"status": "ended", "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to end session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to end session")

@app.get("/sessions")
async def list_sessions():
    """List all sessions"""
    return {"sessions": list(sessions.values())}

if __name__ == "__main__":
    import uvicorn

    logger.info("🚀 Starting AI Voicei Test Backend...")
    logger.info("Frontend should be accessible at: http://localhost:5173")
    logger.info("Backend API accessible at: http://localhost:7860")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,
        log_level="info"
    )