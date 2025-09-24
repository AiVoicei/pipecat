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

## Agenty Platform - White-Label Agent Creation System Development

### Project Evolution 🚀
This repository has evolved from a successful Hebrew voice AI application into **Agenty** - a comprehensive white-label SaaS platform for creating and deploying custom voice AI agents using all Pipecat capabilities.

### New Platform Vision
**Agenty** is a complete white-label agent creation and management system that allows users to:
- Build custom voice agents with drag-and-drop interface
- Choose from 40+ AI providers (STT, LLM, TTS)
- Deploy via WebRTC, Twilio phone, or embed widgets
- Manage multiple agents with enterprise features
- **White-label the platform** for reselling to their own customers
- Use "Build with Agenty" AI-powered agent generation

### Current Architecture Foundation
✅ **Completed Base Application:**
- **Backend**: FastAPI web server with Gemini Multimodal Live (`aivoicei_web_server.py`)
- **Frontend**: Professional React application with Hebrew RTL support and dark theme
- **Integration**: Full frontend-backend communication with session management
- **Transport**: WebRTC for real-time voice communication
- **Design System**: Shadcn/ui + Tailwind CSS with AI Voicei branding

### Platform Development Plan
See `AI_VOICEI_PROJECT_PLAN.md` for the comprehensive new platform roadmap:

**6-Phase Platform Development (14 weeks):**
- 🎯 **Phase 1: Platform Foundation** - Agent builder UI, provider selection, templates
- 🔧 **Phase 2: Agent Engine** - Dynamic agent generation, all provider integrations
- 🎨 **Phase 3: Advanced UI/UX** - Enhanced visual builder, analytics, mobile design
- 📞 **Phase 4: Deployment Options** - Twilio, embed widgets, API endpoints, WhatsApp
- 🚀 **Phase 5: Enterprise & White-Label** - Multi-tenant, billing, white-label system
- 🤖 **Phase 6: "Build with Agenty"** - AI-powered agent generation from prompts

### Platform Technical Stack
- **Frontend**: Next.js 15.5.3 + TypeScript (✅ migrated from React)
- **UI Components**: Shadcn/ui + Radix UI (✅ integrated design system)
- **Styling**: Tailwind CSS (✅ enhanced with Hebrew RTL and dark theme)
- **Backend**: FastAPI + Python 3.12 (✅ operational foundation)
- **Agent Engine**: Dynamic Pipecat pipeline generation
- **Database**: PostgreSQL + Redis (✅ PostgreSQL implemented)
- **Deployment**: Vercel (frontend) + Railway/Fly.io (backend)

### Platform Key Features
**Agent Builder:**
- Visual drag & drop pipeline builder (STT → LLM → TTS)
- Provider marketplace with 19 major AI services
- Template gallery with pre-built agent types
- Multi-language support (Hebrew, English, Spanish+)
- Voice personality designer
- **"Build with Agenty"** - AI-powered agent generation from prompts

**Deployment Options:**
- WebRTC web integration (current working system)
- Twilio phone number integration
- JavaScript embed widgets for websites
- REST/GraphQL API endpoints
- WhatsApp and SMS bot deployment

**White-Label & Enterprise Features:**
- **Complete white-label platform** for resellers
- **Reseller dashboard** and client management
- **Custom branding** and domain support
- Multi-tenant workspaces and team management
- Advanced analytics and conversation insights
- A/B testing for agent configurations
- Compliance tools (GDPR, HIPAA, SOC2)
- **Revenue sharing** model (70/30 split)

### Current Status: Phase 2 COMPLETED! 🎉
**Date:** September 24, 2025
**Milestone:** Complete Agent Engine System with Database Integration
**Overall Progress:** Phase 2 - **100% COMPLETE** (Final milestone achieved!)

**🎉 PHASE 2 FINAL ACCOMPLISHMENTS:**
1. ✅ **Complete 4-Step Agent Builder**: Basic Info → Provider Selection → Pipeline Builder → Testing
2. ✅ **Provider Integration**: 19 major AI providers (STT, LLM, TTS, **Realtime**) with secure credential management
3. ✅ **Visual Pipeline Builder**: React Flow-based drag-drop interface for agent creation
4. ✅ **Complete Translation System**: 800+ keys in Hebrew RTL and English with professional UI/UX
5. ✅ **Enhanced Platform Integration**: AI Voicei preserved with improved navigation and theming
6. ✅ **Complete Backend Engine**: Dynamic AgentFactory with 19 major providers integrated
7. ✅ **PostgreSQL Database**: Complete database models with async CRUD operations
8. ✅ **Production API**: FastAPI backend with comprehensive error handling and session management
9. ✅ **Realtime Speech-to-Speech**: OpenAI Realtime API & Gemini 2.0 Flash Live integration with accurate 2025 specifications

**🎯 Current Platform Capabilities:**
- **Fully Functional Agent Creation**: End-to-end visual agent builder
- **Provider Integration**: 19 major providers complete (OpenAI, Deepgram, Azure, Anthropic, ElevenLabs, Cartesia, and 13 others)
- **Multi-language Platform**: Professional Hebrew RTL ↔ English switching
- **Real-time Testing**: AI Voicei integration for immediate agent testing
- **Professional UI/UX**: Dark/light themes, responsive design, enhanced navigation
- **Database System**: PostgreSQL with complete persistence and session tracking
- **Production API**: FastAPI backend ready for deployment
- **Secure Credentials**: Encrypted API key storage and validation

**Next Phase Options:**
1. **Launch Phase 3**: Advanced UI/UX, analytics dashboard, and mobile design
2. **Launch Phase 4**: Multi-channel deployment (Twilio, WhatsApp, embed widgets)
3. **Production Deployment**: Deploy platform for user testing and feedback

### Key Files (Updated Structure)
**Frontend (Complete Next.js Platform):**
- **`agenty-platform/apps/web/`** - ✅ Complete Next.js 15.5.3 platform with Turbopack
- **`src/components/features/builder/AgentBuilder.tsx`** - ✅ Complete 4-step agent creation wizard
- **`src/components/features/providers/ProviderMarketplace.tsx`** - ✅ Full provider marketplace UI
- **`src/components/features/builder/PipelineBuilder.tsx`** - ✅ Visual drag-drop pipeline builder
- **`src/contexts/LanguageContext.tsx`** - ✅ Complete translation system (800+ keys)

**Backend (FastAPI Engine):**
- **`agenty-platform/apps/api/`** - ✅ Complete FastAPI backend with agent engine
- **`src/services/agent_factory.py`** - ✅ Dynamic agent factory for pipeline generation
- **`src/services/provider_service.py`** - ✅ Provider integration with 19 major providers
- **`src/services/database_service.py`** - ✅ Complete database CRUD operations
- **`src/models/`** - ✅ Complete PostgreSQL database models
- **`src/core/database.py`** - ✅ Database configuration and session management
- **`aivoicei_web_server.py`** - ✅ Working AI Voicei reference implementation

**Documentation:**
- **`AI_VOICEI_PROJECT_PLAN.md`** - ✅ Updated platform roadmap with Phase 2 complete
- **`plans/phase-2-agent-engine-development.md`** - ✅ Detailed Phase 2 status (100% complete)
- **`PHASE_2_COMPLETION_REPORT.md`** - ✅ Comprehensive completion report and achievements

### Context7 MCP Server Integration
Platform has access to Context7 MCP server for enhanced capabilities:

#### MCP Server Details
- **Server**: Context7 (https://mcp.context7.com/mcp)
- **Authentication**: API key configured (ctx7sk-21ffc30d-f533-48c9-b811-5a1bd7b0f4fd)
- **Transport**: HTTP transport
- **Purpose**: Enhanced context management and external integrations

#### Platform MCP Usage
Context7 can enhance platform development with:
- Advanced agent context management
- External service integrations for agents
- Enhanced data processing capabilities
- Professional-grade functionality improvements

### Development Philosophy
**Building on Success:** The platform maintains all successful elements from the current application:
- AI Voicei branding and Hebrew RTL support
- Dark theme and professional design
- Shadcn/ui component library
- FastAPI backend architecture
- WebRTC communication system

**Scaling Up:** Transforming single-use app into multi-tenant platform:
- From one agent to unlimited agents per user
- From single provider to 40+ provider marketplace
- From web-only to multi-channel deployment
- From individual use to enterprise teams

### ✅ Phase 1 Progress: UI/UX Foundation Complete (September 2025)

**Status:** Successfully integrated AI Voicei into Agenty platform foundation ✅
**Date Completed:** September 22, 2025
**Timeline Remaining:** 13 weeks to full platform launch (including AI generation)
**Vision:** Complete white-label SaaS platform for voice AI agent creation and management

#### Integration Achievement ✅
**Major Milestone:** Original AI Voicei application successfully preserved within new Agenty platform architecture

**Technical Success:**
- **AI Voicei Interface**: Complete Hebrew RTL voice interface functional in Agenty platform ✅
- **Component Migration**: All voice components migrated without data loss ✅
- **Server Infrastructure**: Backend (localhost:7860) + Frontend (localhost:3000) operational ✅
- **Agent Test Route**: `/agents/[id]/test` displays full AI Voicei functionality ✅
- **API Integration**: Session management and WebRTC communication working ✅

**Current Operational Status:**
- AI Voicei Backend: FastAPI with Gemini Multimodal Live ✅ **RUNNING**
- Agenty Frontend: Next.js 15.5.3 with Turbopack ✅ **RUNNING**
- Voice Communication: WebRTC real-time Hebrew conversations ✅ **FUNCTIONAL**
- Design System: Shadcn/ui + Hebrew RTL + Dark theme preserved ✅ **IMPLEMENTED**

#### Recent UI/UX Enhancements (September 2025) ✅
**Major Theme System Overhaul:**
- **Color System**: Fixed primary color implementation (purple #8B5CF6) through Tailwind CSS v4 configuration
- **Theme Switching**: Implemented complete dark/light mode toggle with next-themes integration
- **Enhanced Dark Mode**: Professional darker theme (background: #0D0D0D, cards: #161616)
- **Language System**: Fixed Hebrew RTL/LTR switching without manual reload
- **Translation Coverage**: Completed status badge translations ("active"/"פעיל", "inactive"/"לא פעיל")

**Templates System Enhancement (September 22, 2025):**
- **Navigation Consistency**: All platform pages now use AppLayout with unified sidebar and top bar
- **Image-Free Design**: Removed all external image dependencies from templates system
- **Icon-Based Previews**: Professional FileText icons with gradient backgrounds
- **Complete Translation Coverage**: Comprehensive `templates` namespace with Hebrew and English

**Technical Implementation Details:**
- **Tailwind Config**: Created `tailwind.config.ts` with explicit color mappings for CSS v4
- **Theme Provider**: Implemented `ThemeProvider` wrapper with proper SSR handling
- **Language Context**: Enhanced immediate DOM direction updates without reload
- **Component Updates**: Dashboard and AgentTestInterface use proper translation functions
- **Template Store**: Removed thumbnailUrl fields and external image references
- **AppLayout Integration**: Consistent navigation across all flows

**Files Enhanced:**
- `tailwind.config.ts` - New Tailwind CSS v4 configuration
- `globals.css` - Enhanced dark theme with professional colors
- `theme-provider.tsx` - Theme switching infrastructure
- `theme-toggle.tsx` - User interface for theme switching
- `LanguageContext.tsx` - Improved RTL/LTR switching and comprehensive translations
- `useTemplateStore.ts` - Removed image dependencies, clean icon-based design
- `/app/templates/[id]/page.tsx` - AppLayout integration and image-free template details
- `/app/templates/page.tsx` - Navigation consistency and proper translations
- `/app/builder/page.tsx` - Unified navigation layout
- Dashboard/AgentTestInterface - Translation integration

#### Phase 2 Complete - Ready for Production! 🎉
**Current Status:** Phase 2 is 100% complete with production-ready agent creation system
**Achievements:** Complete database integration, 19 provider integrations, production API
**Next Steps:** Deploy to staging/production OR begin Phase 3 development

## 📊 **Current Project Status Summary**

### ✅ **Phase 1 Complete (100%)**
- Professional Next.js platform with enhanced UI/UX
- AI Voicei successfully integrated and preserved
- Complete translation system (Hebrew RTL + English)
- Professional design system with dark/light themes

### ✅ **Phase 2 Complete (100%)**
- Complete agent engine with 19 provider integrations
- Production-ready PostgreSQL database system
- Full FastAPI backend with async operations
- Visual agent builder with professional UI
- Secure credential management system

### 🎯 **Ready for Next Phase**
The platform now has a complete, production-ready foundation for voice AI agent creation and management. All core systems are operational and ready for user testing or Phase 3 development.