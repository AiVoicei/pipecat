# 🚀 Agenty Platform API

The backend API for the Agenty white-label voice AI agent creation platform.

## 📋 Overview

This FastAPI-based backend provides:

- **Agent Management**: Create, configure, and deploy voice AI agents
- **Provider Marketplace**: Access 40+ AI providers (STT, LLM, TTS)
- **Credential Management**: Secure API key storage and validation
- **Real-time Control**: Start, stop, and monitor agent instances
- **Configuration Testing**: Test agent setups before deployment

## 🏗️ Architecture

```
agenty-platform/apps/api/
├── src/
│   ├── api/v1/              # API endpoints
│   │   ├── agents.py        # Agent CRUD operations
│   │   └── providers.py     # Provider marketplace
│   ├── schemas/             # Pydantic models
│   │   ├── agent.py         # Agent configuration schemas
│   │   └── provider.py      # Provider schemas
│   ├── services/            # Business logic
│   │   ├── agent_factory.py # Dynamic agent creation
│   │   └── provider_service.py # Provider management
│   ├── utils/               # Utilities
│   │   └── dependencies.py  # Dependency injection
│   └── main.py              # FastAPI application
├── requirements.txt         # Python dependencies
├── run_api.py              # Development startup script
└── test_api.py             # API test suite
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agenty-platform/apps/api
pip install -r requirements.txt
```

### 2. Start Development Server

```bash
python run_api.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### 3. Test the API

```bash
python test_api.py
```

## 📡 API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/v1/status` - API status and statistics

### Agent Management

- `POST /api/v1/agents/` - Create new agent
- `GET /api/v1/agents/` - List user's agents
- `GET /api/v1/agents/{id}` - Get agent details
- `PUT /api/v1/agents/{id}` - Update agent
- `DELETE /api/v1/agents/{id}` - Delete agent
- `POST /api/v1/agents/{id}/start` - Start agent
- `POST /api/v1/agents/{id}/stop` - Stop agent
- `GET /api/v1/agents/{id}/status` - Get agent status
- `POST /api/v1/agents/test-configuration` - Test configuration
- `WS /api/v1/agents/{id}/ws` - WebSocket connection

### Provider Marketplace

- `GET /api/v1/providers/` - List all providers
- `GET /api/v1/providers/marketplace` - User's provider status
- `GET /api/v1/providers/{name}` - Get provider details
- `POST /api/v1/providers/credentials` - Store credentials
- `GET /api/v1/providers/credentials/` - List user credentials
- `PUT /api/v1/providers/credentials/{name}` - Update credentials
- `DELETE /api/v1/providers/credentials/{name}` - Delete credentials
- `POST /api/v1/providers/validate` - Validate credentials

### Agent Templates

- `GET /api/v1/agents/templates/` - List templates
- `POST /api/v1/agents/from-template/{id}` - Create from template

## 🔐 Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

For development, use the mock token: `test-token`

## 📊 Agent Configuration

Agents are configured with this schema:

```json
{
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
```

## 🤖 Supported Providers

### STT (Speech-to-Text)
- OpenAI Whisper, Deepgram, AssemblyAI, Azure, Google
- Speechmatics, Gladia, Groq, Cartesia, Soniox, AWS, Sambanova

### LLM (Large Language Models)
- OpenAI, Anthropic, Google Gemini, Azure OpenAI, AWS Bedrock
- Groq, Together, Fireworks, Cerebras, DeepSeek, Perplexity
- Ollama, Mistral, Qwen, Grok, NIM, OpenRouter, OpenPipe

### TTS (Text-to-Speech)
- ElevenLabs, Cartesia, Azure, Google, AWS Polly
- PlayHT, XTTS, Neuphonic, Rime, Sarvam

## 🧪 Testing

Run the test suite:

```bash
python test_api.py
```

Tests cover:
- Health checks
- Provider marketplace
- Agent templates
- Configuration validation
- API status

## 🔧 Development

### Adding New Providers

1. Update provider registry in `services/provider_service.py`
2. Add provider-specific configuration in `schemas/provider.py`
3. Implement service creation in `services/agent_factory.py`

### Adding New Endpoints

1. Create new router in `api/v1/`
2. Add schemas in `schemas/`
3. Include router in `main.py`

## 🚀 Production Deployment

For production deployment:

1. Set environment variables:
   ```bash
   export ENVIRONMENT=production
   export DATABASE_URL=postgresql://...
   export ENCRYPTION_KEY=your-secure-key
   export JWT_SECRET=your-jwt-secret
   ```

2. Use production ASGI server:
   ```bash
   gunicorn -k uvicorn.workers.UvicornWorker src.main:app
   ```

## 📈 Monitoring

- Health check: `GET /health`
- API status: `GET /api/v1/status`
- Active agents: Tracked in agent factory
- WebSocket connections: Real-time monitoring

## 🔒 Security

- JWT authentication required
- Encrypted credential storage
- Input validation with Pydantic
- CORS protection
- Rate limiting (planned)

## 📖 Documentation

- Swagger UI: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/api/v1/openapi.json
- Custom branding in documentation

## 🤝 Integration

This API integrates with:
- **Frontend**: Next.js Agenty platform (`localhost:3000`)
- **Pipecat**: Dynamic pipeline generation
- **AI Providers**: 40+ supported services
- **WebRTC**: Real-time voice communication

## 📞 Support

For API support:
- GitHub Issues: [Create Issue](https://github.com/agenty/platform/issues)
- Email: support@agenty.com
- Documentation: [docs.agenty.com](https://docs.agenty.com)

---

**Status**: ✅ Phase 2 Implementation Complete
**Last Updated**: September 22, 2025