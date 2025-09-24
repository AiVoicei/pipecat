#!/usr/bin/env python3
"""
Simple test server for the Agenty Platform API
Tests basic provider endpoints without complex imports
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="Agenty Test API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock providers data - aligned with actual Pipecat providers
MOCK_PROVIDERS = [
    # STT Providers
    {
        "id": "prv_openai_stt",
        "name": "OpenAI",
        "display_name": "OpenAI Whisper",
        "type": "stt",
        "description": "High-quality speech-to-text with Whisper models",
        "logo_url": "https://cdn.openai.com/API/logo-openai.svg",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_minute",
            "cost_per_unit": 0.006,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["whisper-1"], "default": "whisper-1"},
                "language": {"type": "string", "default": "en"}
            },
            "required": ["model"]
        },
        "capabilities": {"multi_language": True, "high_accuracy": True, "real_time": True},
        "supported_formats": ["wav", "mp3", "m4a", "webm"]
    },
    {
        "id": "prv_deepgram_stt",
        "name": "Deepgram",
        "display_name": "Deepgram Nova",
        "type": "stt",
        "description": "Fast and accurate speech recognition with Nova models",
        "logo_url": "https://deepgram.com/favicon.ico",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_minute",
            "cost_per_unit": 0.0043,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["nova-2", "nova", "enhanced"], "default": "nova-2"},
                "language": {"type": "string", "default": "en"}
            },
            "required": ["model"]
        },
        "capabilities": {"real_time": True, "speaker_diarization": True, "punctuation": True},
        "supported_formats": ["wav", "mp3", "m4a", "flac", "webm"]
    },

    # LLM Providers
    {
        "id": "prv_openai_llm",
        "name": "OpenAI",
        "display_name": "OpenAI GPT",
        "type": "llm",
        "description": "Advanced language models with GPT series",
        "logo_url": "https://cdn.openai.com/API/logo-openai.svg",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_token",
            "input_cost": 0.005,
            "output_cost": 0.015,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["gpt-4o", "gpt-4", "gpt-3.5-turbo"], "default": "gpt-4o"},
                "max_tokens": {"type": "integer", "minimum": 1, "maximum": 4096, "default": 1000},
                "temperature": {"type": "number", "minimum": 0, "maximum": 2, "default": 0.7}
            },
            "required": ["model"]
        },
        "capabilities": {"function_calling": True, "reasoning": True, "multilingual": True},
        "supported_formats": []
    },
    {
        "id": "prv_anthropic_llm",
        "name": "Anthropic",
        "display_name": "Anthropic Claude",
        "type": "llm",
        "description": "Advanced language models with Claude series",
        "logo_url": "https://cdn.anthropic.com/logo.svg",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_token",
            "input_cost": 0.008,
            "output_cost": 0.024,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"], "default": "claude-3-sonnet"},
                "max_tokens": {"type": "integer", "minimum": 1, "maximum": 4096, "default": 1000}
            },
            "required": ["model"]
        },
        "capabilities": {"function_calling": True, "reasoning": True, "multilingual": True},
        "supported_formats": []
    },

    # TTS Providers
    {
        "id": "prv_elevenlabs_tts",
        "name": "ElevenLabs",
        "display_name": "ElevenLabs",
        "type": "tts",
        "description": "Ultra-realistic text-to-speech with voice cloning",
        "logo_url": "https://elevenlabs.io/favicon.ico",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_character",
            "cost_per_unit": 0.00018,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "voice": {"type": "string", "enum": ["Rachel", "Drew", "Clyde", "Paul"], "default": "Rachel"},
                "stability": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.75}
            },
            "required": ["voice"]
        },
        "capabilities": {"voice_cloning": True, "emotional_range": True, "streaming": True},
        "supported_formats": ["mp3", "wav"]
    },
    {
        "id": "prv_cartesia_tts",
        "name": "Cartesia",
        "display_name": "Cartesia Sonic",
        "type": "tts",
        "description": "Real-time neural text-to-speech with low latency",
        "logo_url": "https://cartesia.ai/favicon.ico",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_character",
            "cost_per_unit": 0.00025,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "voice": {"type": "string", "enum": ["professional_male", "professional_female", "casual_male", "casual_female"], "default": "professional_female"},
                "speed": {"type": "number", "minimum": 0.5, "maximum": 2.0, "default": 1.0}
            },
            "required": ["voice"]
        },
        "capabilities": {"real_time": True, "low_latency": True, "emotional_range": True, "streaming": True},
        "supported_formats": ["mp3", "wav"]
    },

    # Real-time Speech-to-Speech Models
    {
        "id": "prv_openai_realtime",
        "name": "OpenAI",
        "display_name": "OpenAI Realtime API",
        "type": "realtime",
        "description": "Real-time speech-to-speech conversation with GPT-4o",
        "logo_url": "https://cdn.openai.com/API/logo-openai.svg",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_minute",
            "input_cost": 0.06,
            "output_cost": 0.24,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["gpt-4o-realtime-preview"], "default": "gpt-4o-realtime-preview"},
                "voice": {"type": "string", "enum": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], "default": "alloy"},
                "temperature": {"type": "number", "minimum": 0, "maximum": 2, "default": 0.8},
                "max_response_output_tokens": {"type": "integer", "minimum": 1, "maximum": 4096, "default": 4096}
            },
            "required": ["model", "voice"]
        },
        "capabilities": {"real_time": True, "speech_to_speech": True, "low_latency": True, "interruption": True, "function_calling": True},
        "supported_formats": ["audio/pcm16"]
    },
    {
        "id": "prv_gemini_multimodal",
        "name": "Google",
        "display_name": "Gemini Multimodal Live",
        "type": "realtime",
        "description": "Real-time multimodal conversation with Gemini 2.0 Flash",
        "logo_url": "https://ai.google.dev/static/site-assets/images/gemini-gradient.svg",
        "status": "available",
        "implementation_status": "implemented",
        "pricing": {
            "model": "per_minute",
            "input_cost": 0.075,
            "output_cost": 0.30,
            "currency": "USD"
        },
        "configuration_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "enum": ["gemini-2.0-flash-exp"], "default": "gemini-2.0-flash-exp"},
                "voice": {"type": "string", "enum": ["Puck", "Charon", "Kore", "Fenrir"], "default": "Puck"},
                "temperature": {"type": "number", "minimum": 0, "maximum": 2, "default": 1.0},
                "response_modalities": {"type": "array", "items": {"type": "string", "enum": ["AUDIO", "TEXT"]}, "default": ["AUDIO"]}
            },
            "required": ["model"]
        },
        "capabilities": {"real_time": True, "speech_to_speech": True, "multimodal": True, "vision": True, "low_latency": True, "interruption": True, "function_calling": True},
        "supported_formats": ["audio/pcm16", "image/*"]
    }
]

@app.get("/")
async def root():
    return {
        "name": "Agenty Test API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/providers")
async def get_providers():
    return MOCK_PROVIDERS

@app.get("/api/v1/providers/marketplace")
async def get_marketplace():
    return {"providers": MOCK_PROVIDERS}

@app.get("/api/v1/providers/types/stt")
async def get_stt_providers():
    stt_providers = [p for p in MOCK_PROVIDERS if p["type"] == "stt"]
    return {"providers": stt_providers}

@app.get("/api/v1/providers/types/llm")
async def get_llm_providers():
    llm_providers = [p for p in MOCK_PROVIDERS if p["type"] == "llm"]
    return {"providers": llm_providers}

@app.get("/api/v1/providers/types/tts")
async def get_tts_providers():
    tts_providers = [p for p in MOCK_PROVIDERS if p["type"] == "tts"]
    return {"providers": tts_providers}

@app.get("/api/v1/providers/types/realtime")
async def get_realtime_providers():
    realtime_providers = [p for p in MOCK_PROVIDERS if p["type"] == "realtime"]
    return {"providers": realtime_providers}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("test_server:app", host="0.0.0.0", port=8000, reload=True)