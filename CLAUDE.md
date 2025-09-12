# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pipecat** is an open-source Python framework for building real-time voice and multimodal conversational AI agents. It provides a pipeline-based architecture for orchestrating audio, video, AI services, and transports with ultra-low latency.

## Development Commands

### Setup
```bash
# Install dependencies for development
uv sync --group dev --all-extras --no-extra gstreamer --no-extra krisp --no-extra local

# Install pre-commit hooks
uv run pre-commit install
```

### Testing
```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_name.py

# Run with coverage
uv run coverage run --module pytest
```

### Code Quality
```bash
# Format and lint code
uv run ruff format
uv run ruff check

# Run all pre-commit checks
uv run pre-commit run --all-files
```

### Building
```bash
# Build package
uv build

# Generate API documentation
cd docs/api && ./build-docs.sh
```

## Architecture Overview

### Core Components

- **Frames**: Unified data structures (`src/pipecat/frames/`) - all data (audio, text, images, control) flows through Frame objects
- **Pipeline**: Orchestration layer (`src/pipecat/pipeline/`) - manages frame flow through processor chains  
- **Processors**: Processing components (`src/pipecat/processors/`) - transform frames (aggregators, filters, generators)
- **Services**: AI service integrations (`src/pipecat/services/`) - 40+ providers for STT, LLM, TTS, etc.
- **Transports**: Communication layer (`src/pipecat/transports/`) - WebRTC, WebSocket, Daily, LiveKit support

### Frame System

All data flows through a unified Frame system with bidirectional processing:
- **Downstream**: Data flows from source to sink (AudioRawFrame → TranscriptionFrame → LLMResponseFrame)
- **Upstream**: Control flows from sink to source (InterruptionFrame, EndFrame)
- **Frame Types**: Audio, text, image, system, control frames (50+ types defined in `frames.py`)

### Pipeline Patterns

Standard pipeline flow:
```
Transport Input → STT Service → LLM Context → LLM Service → TTS Service → Transport Output
```

Key pipeline concepts:
- **Source → Processors → Sink** linear chain architecture
- **Context Aggregators** manage conversation state
- **Frame Filters** control data flow
- **Observers** provide monitoring and logging

### Service Architecture

Services follow consistent patterns:
- **Base Classes**: `STTService`, `LLMService`, `TTSService` define interfaces
- **Provider Implementations**: Service-specific implementations (40+ providers)
- **Async Processing**: All services are async-first for real-time performance
- **Configuration**: Service-specific settings via constructor parameters

## Key Architectural Decisions

### Frame-Based Processing
- **Unified Data Model**: All data types use Frame objects for consistent processing
- **Type Safety**: Pydantic models ensure frame validation
- **Bidirectional Flow**: Supports both data processing and control signaling

### Async-First Design
- **Real-Time Requirements**: Voice/video processing demands low latency
- **Task Management**: `BaseTaskManager` handles async lifecycle
- **Event-Driven**: Services react to frame events rather than polling

### Plugin Architecture
- **Optional Dependencies**: Use `extras_require` for service-specific dependencies
- **Lightweight Core**: Framework core has minimal dependencies
- **Service Discovery**: Services auto-register when dependencies are available

### Context Management
- **Conversation State**: `LLMContext` classes manage chat history
- **Universal Context**: Cross-provider conversation state management
- **Context Aggregators**: Collect and structure conversation data

## File Structure Patterns

### Service Implementation Structure
```
src/pipecat/services/[provider]/
├── __init__.py          # Service exports
├── llm.py              # LLM implementation (if supported)
├── stt.py              # STT implementation (if supported)
├── tts.py              # TTS implementation (if supported)
└── [other].py          # Provider-specific modules
```

### Common Base Classes
- `FrameProcessor` - Base for all frame processors
- `AIService` - Base for AI service implementations
- `STTService`, `LLMService`, `TTSService` - Service-specific bases
- `BaseTransport` - Transport layer base class

## Development Guidelines

### Adding New Services
1. Create provider directory in `src/pipecat/services/[provider]/`
2. Implement service classes inheriting from appropriate base classes
3. Add provider dependencies to `pyproject.toml` optional-dependencies
4. Export classes in provider `__init__.py`
5. Add service to main services `__init__.py`

### Frame Processing
- Always handle frame flow in both directions (process_frame/process_upstream_frame)
- Use proper frame types defined in `frames.py`
- Implement proper async patterns for real-time processing
- Add metrics and logging via observers when appropriate

### Testing
- Unit tests in `tests/` directory
- Use pytest fixtures for common setup
- Mock external services for CI/CD
- Include integration tests for service combinations

## Examples and Learning

The `examples/foundational/` directory contains 44 progressive examples:
- **01-say-one-thing.py**: Basic TTS output
- **06-listen-and-respond.py**: Full conversational flow  
- **07-interruptible.py**: Voice activity detection and interruption
- **14-function-calling.py**: LLM tool integration
- **19-openai-realtime.py**: Speech-to-speech models

These examples demonstrate core concepts and can be used as templates for new functionality.

## Configuration

### Environment Setup
- Copy `env.example` to `.env` for API keys
- Use service-specific environment variables
- Configure transport parameters (WebRTC, Daily rooms, etc.)

### Optional Dependencies
Install service-specific dependencies:
```bash
uv add "pipecat-ai[anthropic,deepgram,elevenlabs]"  # Example providers
```

Common extras: `daily`, `openai`, `anthropic`, `deepgram`, `elevenlabs`, `cartesia`, `webrtc`, `websocket`

## AI Voicei Project - Current Development

### Project Status
This repository is currently being transformed into **AI Voicei** - a production-ready Hebrew voice AI application. The main bot is located in `gemini_multimodal_simple_rtvi.py` and uses Google Gemini Multimodal Live for Hebrew conversation.

### Current Architecture
- **Backend**: Python bot with Gemini Multimodal Live service configured for Hebrew
- **Frontend**: Moving from SmallWebRTCPrebuiltUI to custom React application
- **Transport**: WebRTC for real-time voice communication
- **Target**: Production web application for paying customers

### Development Plan
See `AI_VOICEI_PROJECT_PLAN.md` for comprehensive development roadmap including:
- Phase 1: React frontend with Pipecat SDK
- Phase 2: Backend optimization for production
- Phase 3: UI/UX enhancement with AI Voicei branding
- Phase 4: Production features (auth, billing, analytics)
- Phase 5: Deployment and launch

### Key Files
- `gemini_multimodal_simple_rtvi.py` - Main Hebrew voice bot
- `AI_VOICEI_PROJECT_PLAN.md` - Comprehensive project plan
- `logo.webp` - AI Voicei brand logo
- `custom_client.html` - Previous custom client attempt (deprecated)

### Production Goals
- Hebrew-speaking voice AI for customers
- Custom branding (AI Voicei instead of Pipecat Playground)
- Subscription-based business model
- Professional customer-facing interface
- WebRTC-based real-time communication

### Context7 MCP Server Integration
This project now has access to the Context7 MCP server for enhanced capabilities:

#### MCP Server Details
- **Server**: Context7 (https://mcp.context7.com/mcp)  
- **Authentication**: API key configured (ctx7sk-21ffc30d-f533-48c9-b811-5a1bd7b0f4fd)
- **Transport**: HTTP transport
- **Purpose**: Enhanced context management and external integrations

#### Available MCP Capabilities
The Context7 server can provide:
- External API integrations
- Enhanced context management
- Data retrieval and processing
- Third-party service connections

#### Usage in Development
When working on AI Voicei features, Claude Code can now leverage Context7 MCP capabilities for:
- Advanced context handling for conversations
- Integration with external services
- Enhanced data processing for the voice AI
- Professional-grade functionality improvements

### Current Phase: Planning Complete
**Next Action**: Begin Phase 1 - Frontend Foundation
- Set up React TypeScript project with Vite
- Configure Shadcn/ui + Tailwind CSS
- Install Pipecat React SDK
- Create basic project structure with shadcn components
- Implement AI Voicei branding