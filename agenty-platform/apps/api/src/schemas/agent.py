"""
Agent configuration schemas for the Agenty platform.
Defines the structure for agent configurations, templates, and related data models.
"""

import re
from typing import Dict, Any, Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class AgentStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPLOYING = "deploying"
    ERROR = "error"


class ProviderType(str, Enum):
    STT = "stt"
    LLM = "llm"
    TTS = "tts"


class TransportType(str, Enum):
    WEBRTC = "webrtc"
    TWILIO = "twilio"
    WEBSOCKET = "websocket"
    API = "api"


class STTProviderConfig(BaseModel):
    """Speech-to-Text provider configuration"""
    provider: Literal[
        "openai", "deepgram", "assemblyai", "azure", "google",
        "speechmatics", "gladia", "groq", "cartesia", "soniox",
        "aws", "sambanova"
    ]
    settings: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "provider": "openai",
                "settings": {
                    "model": "whisper-1",
                    "language": "he-IL"
                }
            }
        }


class LLMProviderConfig(BaseModel):
    """Large Language Model provider configuration"""
    provider: Literal[
        "openai", "anthropic", "google", "azure", "aws", "groq",
        "together", "fireworks", "cerebras", "deepseek", "perplexity",
        "ollama", "mistral", "qwen", "grok", "nim", "openrouter", "openpipe"
    ]
    settings: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "provider": "openai",
                "settings": {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "max_tokens": 150
                }
            }
        }


class TTSProviderConfig(BaseModel):
    """Text-to-Speech provider configuration"""
    provider: Literal[
        "elevenlabs", "cartesia", "azure", "google", "aws",
        "playht", "xtts", "neuphonic", "rime", "sarvam"
    ]
    settings: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "provider": "elevenlabs",
                "settings": {
                    "voice_id": "21m00Tcm4TlvDq8ikWAM",
                    "stability": 0.5,
                    "similarity_boost": 0.8
                }
            }
        }


class TransportConfig(BaseModel):
    """Transport configuration for agent deployment"""
    type: TransportType
    settings: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        schema_extra = {
            "example": {
                "type": "webrtc",
                "settings": {
                    "audio_in_enabled": True,
                    "audio_out_enabled": True,
                    "video_enabled": False
                }
            }
        }


class AgentConfiguration(BaseModel):
    """Complete agent configuration"""
    stt: STTProviderConfig
    llm: LLMProviderConfig
    tts: TTSProviderConfig
    transport: TransportConfig

    # Agent behavior settings
    personality: Optional[str] = Field(None, description="Agent personality description")
    system_prompt: Optional[str] = Field(None, description="System prompt for the LLM")
    language: str = Field("en", description="Primary language for the agent")

    # Advanced settings
    interruption_enabled: bool = Field(True, description="Allow user interruptions")
    vad_enabled: bool = Field(True, description="Voice Activity Detection enabled")
    background_sound: Optional[str] = Field(None, description="Background sound URL")

    @validator('language')
    def validate_language(cls, v):
        """Validate language code format"""
        if not re.match(r'^[a-z]{2}(-[A-Z]{2})?$', v):
            raise ValueError('Language must be in format "en" or "en-US"')
        return v


class DeploymentConfig(BaseModel):
    """Agent deployment configuration"""
    status: AgentStatus = AgentStatus.DRAFT
    endpoints: List[str] = Field(default_factory=list)
    custom_domain: Optional[str] = None
    auto_scale: bool = Field(False, description="Enable auto-scaling")
    max_instances: int = Field(1, description="Maximum number of instances")
    health_check_enabled: bool = Field(True, description="Enable health monitoring")


class AgentCreate(BaseModel):
    """Schema for creating a new agent"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    configuration: AgentConfiguration
    deployment: Optional[DeploymentConfig] = Field(default_factory=DeploymentConfig)
    template_id: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "name": "Customer Service Bot",
                "description": "Hebrew-speaking customer service agent",
                "configuration": {
                    "stt": {
                        "provider": "openai",
                        "settings": {"model": "whisper-1", "language": "he-IL"}
                    },
                    "llm": {
                        "provider": "openai",
                        "settings": {"model": "gpt-4", "temperature": 0.7}
                    },
                    "tts": {
                        "provider": "elevenlabs",
                        "settings": {"voice_id": "21m00Tcm4TlvDq8ikWAM"}
                    },
                    "transport": {
                        "type": "webrtc",
                        "settings": {}
                    },
                    "language": "he-IL",
                    "system_prompt": "You are a helpful customer service agent."
                }
            }
        }


class AgentUpdate(BaseModel):
    """Schema for updating an existing agent"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    configuration: Optional[AgentConfiguration] = None
    deployment: Optional[DeploymentConfig] = None


class AgentResponse(BaseModel):
    """Schema for agent API responses"""
    id: str
    user_id: str
    name: str
    description: Optional[str]
    configuration: AgentConfiguration
    deployment: DeploymentConfig
    template_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentTemplate(BaseModel):
    """Agent template schema"""
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., description="Template category (e.g., 'customer_service', 'sales')")
    configuration: AgentConfiguration
    is_public: bool = Field(False, description="Whether template is publicly available")
    usage_count: int = Field(0, description="Number of times template has been used")
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        schema_extra = {
            "example": {
                "name": "Customer Service Template",
                "description": "A template for customer service agents",
                "category": "customer_service",
                "configuration": {
                    "stt": {"provider": "openai", "settings": {"model": "whisper-1"}},
                    "llm": {"provider": "openai", "settings": {"model": "gpt-4"}},
                    "tts": {"provider": "elevenlabs", "settings": {}},
                    "transport": {"type": "webrtc", "settings": {}},
                    "system_prompt": "You are a helpful customer service agent."
                },
                "is_public": True
            }
        }


class AgentSession(BaseModel):
    """Agent session schema for runtime management"""
    id: str
    agent_id: str
    session_uuid: str
    status: Literal["starting", "running", "stopping", "stopped", "error"]
    started_at: datetime
    ended_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


# Validation schemas for configuration testing
class ConfigurationTest(BaseModel):
    """Schema for testing agent configurations"""
    configuration: AgentConfiguration
    test_text: Optional[str] = Field("Hello, this is a test message.", description="Text to test with")
    timeout: int = Field(30, description="Test timeout in seconds")


class ConfigurationTestResult(BaseModel):
    """Result of configuration testing"""
    success: bool
    message: str
    test_duration: float
    errors: List[str] = Field(default_factory=list)
    provider_results: Dict[str, Dict[str, Any]] = Field(default_factory=dict)