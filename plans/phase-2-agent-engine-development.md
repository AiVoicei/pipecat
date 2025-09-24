# 🔧 Agenty Platform - Phase 2: Agent Engine Development Plan

## 📋 Overview

**Phase:** 2 (Agent Engine & Provider Integration)
**Timeline:** Weeks 4-6 (Current Phase)
**Status:** Backend Foundation Complete, Frontend Pending
**Goal:** Build the dynamic agent generation engine with full provider support

---

## 🎯 Current Project Status (Week 4)

### ✅ Foundation Complete (Phase 1)
- **Platform Architecture**: Next.js 15.5.3 + FastAPI backend operational
- **AI Voicei Integration**: Original interface preserved at `/agents/[id]/test`
- **UI/UX System**: Dark/light themes, Hebrew RTL, Shadcn/ui design system
- **Voice Communication**: WebRTC + Gemini Multimodal Live functional
- **Session Management**: UUID-based tracking system working

### 🔄 Current Development Focus
Building the core agent generation engine that will power the Agenty platform's ability to create unlimited custom voice agents.

---

## 📋 Phase 2: Agent Engine & Provider Integration (Weeks 4-6)

### 🎯 **Week 4 Objectives (Current)**

#### **2.1 Dynamic Agent Factory System**
**Status**: Foundation Complete (AI Voicei working example)
**Next Steps**: Generalize to support multiple agent configurations

**Tasks:**
- [x] **2.1.1** Design agent configuration schema (JSON-based) ✅ **COMPLETED**
- [x] **2.1.2** Create AgentFactory class for dynamic pipeline generation ✅ **COMPLETED**
- [x] **2.1.3** Implement configuration validation system ✅ **COMPLETED**
- [x] **2.1.4** Build agent template system ✅ **COMPLETED** (basic templates)
- [x] **2.1.5** Create agent lifecycle management (start/stop/restart) ✅ **COMPLETED**

**Technical Specifications:**
```python
# Agent Configuration Schema
{
  "id": "uuid",
  "name": "Agent Name",
  "description": "Agent description",
  "configuration": {
    "stt": {
      "provider": "openai|deepgram|assemblyai|...",
      "settings": { "language": "he-IL", "model": "whisper-1" }
    },
    "llm": {
      "provider": "openai|anthropic|gemini|...",
      "settings": { "model": "gpt-4", "temperature": 0.7 }
    },
    "tts": {
      "provider": "elevenlabs|cartesia|azure|...",
      "settings": { "voice_id": "xyz", "stability": 0.5 }
    },
    "transport": {
      "type": "webrtc|twilio|websocket",
      "settings": {}
    }
  },
  "deployment": {
    "status": "active|inactive|draft",
    "endpoints": ["webrtc", "phone", "api"],
    "custom_domain": null
  }
}
```

#### **2.2 Provider Integration System**
**Status**: Gemini complete, 39+ providers pending
**Goal**: Integrate all 40+ Pipecat providers into platform

**Tasks:**
- [x] **2.2.1** Create provider registry system ✅ **COMPLETED**
- [x] **2.2.2** Build provider credential management ✅ **COMPLETED**
- [x] **2.2.3** Implement provider availability checking ✅ **COMPLETED**
- [x] **2.2.4** Create provider testing interface ✅ **COMPLETED** (API endpoint)
- [ ] **2.2.5** Build provider marketplace UI ❌ **NOT COMPLETED** (no frontend)

**Provider Categories to Integrate:**
```
STT Providers (12):
- OpenAI Whisper, Deepgram, AssemblyAI, Azure, Google, Speechmatics
- Gladia, Groq, Cartesia, Soniox, AWS, Sambanova

LLM Providers (18):
- OpenAI, Anthropic, Google Gemini, Azure OpenAI, AWS Bedrock
- Groq, Together, Fireworks, Cerebras, DeepSeek, Perplexity
- Ollama, Mistral, Qwen, Grok, NIM, OpenRouter, OpnePipe

TTS Providers (10):
- ElevenLabs, Cartesia, Azure, Google, AWS Polly
- PlayHT, XTTS, Neuphonic, Rime, Sarvam
```

---

### 🎯 **Week 5 Objectives**

#### **2.3 Agent Builder UI Development**
**Goal**: Create intuitive drag-and-drop interface for agent creation

**Tasks:**
- [ ] **2.3.1** Design visual pipeline builder wireframes
- [ ] **2.3.2** Implement drag-and-drop canvas with React Flow
- [ ] **2.3.3** Create provider selection components
- [ ] **2.3.4** Build configuration panels for each provider
- [ ] **2.3.5** Add real-time validation and preview
- [ ] **2.3.6** Implement agent testing interface

**UI Components to Build:**
```typescript
// Key Components
- AgentBuilderCanvas: Main drag-and-drop interface
- ProviderNode: Individual provider blocks (STT, LLM, TTS)
- ConfigurationPanel: Provider-specific settings
- AgentPreview: Real-time agent testing
- ProviderMarketplace: Browse available providers
- TemplateGallery: Pre-built agent templates
```

#### **2.4 Configuration Management System**
**Goal**: Robust agent configuration storage and validation

**Tasks:**
- [ ] **2.4.1** Design agent database schema ❌ **NOT COMPLETED** (using mock storage)
- [x] **2.4.2** Create configuration CRUD APIs ✅ **COMPLETED**
- [x] **2.4.3** Implement configuration validation ✅ **COMPLETED**
- [ ] **2.4.4** Build configuration versioning ❌ **NOT COMPLETED**
- [ ] **2.4.5** Add configuration import/export ❌ **NOT COMPLETED**
- [ ] **2.4.6** Create configuration templates ❌ **NOT COMPLETED**

---

### 🎯 **Week 6 Objectives**

#### **2.5 Agent Deployment System**
**Goal**: Deploy and manage agent instances

**Tasks:**
- [ ] **2.5.1** Create agent deployment pipeline
- [ ] **2.5.2** Implement container orchestration
- [ ] **2.5.3** Build load balancing for agent instances
- [ ] **2.5.4** Add health monitoring and auto-restart
- [ ] **2.5.5** Create deployment analytics
- [ ] **2.5.6** Implement horizontal scaling

#### **2.6 Provider Credential Management**
**Goal**: Secure handling of user API keys and credentials

**Tasks:**
- [x] **2.6.1** Design encrypted credential storage ✅ **COMPLETED**
- [ ] **2.6.2** Create credential management UI ❌ **NOT COMPLETED** (no frontend)
- [x] **2.6.3** Implement credential validation ✅ **COMPLETED**
- [ ] **2.6.4** Build credential sharing (team features) ❌ **NOT COMPLETED**
- [ ] **2.6.5** Add credential rotation notifications ❌ **NOT COMPLETED**
- [ ] **2.6.6** Create credential usage analytics ❌ **NOT COMPLETED**

---

## 🗄️ Database Schema Design

### **Core Tables for Phase 2**

```sql
-- Agent Configurations
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL,
    deployment_config JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    template_id UUID REFERENCES agent_templates(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Provider Credentials
CREATE TABLE user_provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- stt, llm, tts
    encrypted_credentials TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent Sessions (Runtime)
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    session_uuid VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'starting',
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Agent Templates
CREATE TABLE agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    configuration JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Provider Registry
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- stt, llm, tts
    display_name VARCHAR(255),
    description TEXT,
    configuration_schema JSONB,
    is_available BOOLEAN DEFAULT true,
    pricing_info JSONB,
    documentation_url VARCHAR(500)
);
```

---

## 🛠️ Technical Implementation Details

### **Agent Factory Architecture**

```python
# agenty-platform/apps/api/src/services/agent_factory.py

class AgentFactory:
    """Dynamic agent creation and management"""

    def __init__(self, db: Session, redis: Redis):
        self.db = db
        self.redis = redis
        self.provider_registry = ProviderRegistry()

    async def create_agent(self, config: AgentConfig) -> Agent:
        """Create new agent from configuration"""
        # Validate configuration
        await self._validate_config(config)

        # Create agent record
        agent = await self._create_agent_record(config)

        # Generate pipeline code
        pipeline_code = await self._generate_pipeline(config)

        # Deploy agent
        deployment = await self._deploy_agent(agent, pipeline_code)

        return agent

    async def _generate_pipeline(self, config: AgentConfig) -> str:
        """Generate Pipecat pipeline code dynamically"""
        template = self._get_pipeline_template()

        # Inject providers
        stt_service = self._create_stt_service(config.stt)
        llm_service = self._create_llm_service(config.llm)
        tts_service = self._create_tts_service(config.tts)

        # Generate pipeline
        pipeline = template.format(
            stt_service=stt_service,
            llm_service=llm_service,
            tts_service=tts_service,
            transport_config=config.transport
        )

        return pipeline

    async def _deploy_agent(self, agent: Agent, pipeline_code: str):
        """Deploy agent to container infrastructure"""
        # Create container
        container = await self._create_container(agent.id, pipeline_code)

        # Start agent
        await container.start()

        # Register endpoints
        await self._register_endpoints(agent, container)

        return container
```

### **Provider Integration System**

```python
# agenty-platform/apps/api/src/services/provider_service.py

class ProviderService:
    """Manage AI provider integrations"""

    def __init__(self, db: Session):
        self.db = db
        self.providers = self._load_providers()

    async def get_available_providers(self, type: str = None) -> List[Provider]:
        """Get list of available providers"""
        query = self.db.query(Provider).filter(Provider.is_available == True)
        if type:
            query = query.filter(Provider.type == type)
        return query.all()

    async def validate_credentials(self, provider: str, credentials: dict) -> bool:
        """Validate provider credentials"""
        provider_client = self._get_provider_client(provider)
        return await provider_client.test_connection(credentials)

    async def create_service_instance(self, provider_config: dict):
        """Create provider service instance"""
        provider_name = provider_config['provider']
        provider_type = provider_config['type']

        if provider_type == 'stt':
            return self._create_stt_service(provider_name, provider_config['settings'])
        elif provider_type == 'llm':
            return self._create_llm_service(provider_name, provider_config['settings'])
        elif provider_type == 'tts':
            return self._create_tts_service(provider_name, provider_config['settings'])
```

---

## 🎨 UI Component Architecture

### **Agent Builder Interface**

```typescript
// agenty-platform/apps/web/src/components/builder/AgentBuilder.tsx

interface AgentBuilderProps {
  agentId?: string;
  templateId?: string;
}

export function AgentBuilder({ agentId, templateId }: AgentBuilderProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Node types for different providers
  const nodeTypes = {
    stt: STTProviderNode,
    llm: LLMProviderNode,
    tts: TTSProviderNode,
    transport: TransportNode,
  };

  return (
    <div className="grid grid-cols-12 h-screen">
      {/* Provider Sidebar */}
      <div className="col-span-3 border-r">
        <ProviderSidebar onAddNode={handleAddNode} />
      </div>

      {/* Canvas */}
      <div className="col-span-6">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Configuration Panel */}
      <div className="col-span-3 border-l">
        {selectedNode && (
          <ConfigurationPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
          />
        )}
      </div>
    </div>
  );
}
```

### **Provider Marketplace**

```typescript
// agenty-platform/apps/web/src/components/providers/ProviderMarketplace.tsx

export function ProviderMarketplace() {
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: providerApi.getAll
  });

  const groupedProviders = useMemo(() =>
    groupBy(providers, 'type'), [providers]);

  return (
    <div className="space-y-8">
      {Object.entries(groupedProviders).map(([type, typeProviders]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-xl font-semibold">
            {type.toUpperCase()} Providers
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {typeProviders.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onSelect={handleProviderSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Success Metrics for Phase 2

### **Technical KPIs**
- [ ] **Agent Creation Time**: < 3 minutes for basic agent
- [ ] **Provider Integration**: 40+ providers working
- [ ] **Configuration Validation**: 100% success rate
- [ ] **Agent Deployment**: < 30 seconds to running
- [ ] **UI Responsiveness**: < 200ms for all interactions

### **Functional KPIs**
- [ ] **Template Usage**: 5+ pre-built templates available
- [ ] **Provider Coverage**: STT (12), LLM (18), TTS (10)
- [ ] **Multi-language**: Hebrew + English + 3 more languages
- [ ] **Error Handling**: Graceful failures with user feedback
- [ ] **Real-time Testing**: Live agent preview working

---

## 🔄 Dependencies & Integration Points

### **Phase 2 Dependencies**
- ✅ **Phase 1 Complete**: Platform foundation operational
- ✅ **AI Voicei Working**: Reference implementation functional
- ✅ **Database Design**: Core schema designed
- ✅ **UI Components**: Shadcn/ui design system in place

### **Integration with Future Phases**
- **Phase 3**: Agent builder UI will enhance with advanced features
- **Phase 4**: Deployment system will extend to phone/SMS/widgets
- **Phase 5**: Multi-tenant features will build on agent management
- **Phase 6**: AI generation will use configuration system

---

## 🚀 Deliverables for Phase 2

### **Week 4 Deliverables**
- [x] Dynamic agent factory system working ✅ **COMPLETED**
- [ ] Provider registry with 40+ providers ⚠️ **PARTIALLY COMPLETED** (6 providers implemented)
- [x] Basic agent configuration management ✅ **COMPLETED**
- [x] Provider credential storage system ✅ **COMPLETED**

### **Week 5 Deliverables**
- [ ] Visual agent builder interface (drag & drop)
- [ ] Provider marketplace UI
- [ ] Agent testing and preview system
- [ ] Configuration validation framework

### **Week 6 Deliverables**
- [ ] Agent deployment pipeline
- [ ] Container orchestration system
- [ ] Health monitoring and auto-restart
- [ ] Complete provider integration testing

---

## 📋 Next Phase Preview

### **Phase 3: Advanced UI & User Experience (Weeks 7-8)**
- Enhanced visual pipeline builder with flow visualization
- Advanced agent configuration options and presets
- Real-time performance analytics dashboard
- Agent sharing and marketplace features
- Mobile-responsive design improvements

**Preparation for Phase 3:**
- User testing sessions for agent builder interface
- Performance optimization for large agent configurations
- Advanced analytics schema design
- Mobile UI/UX design planning

---

---

## 📊 **Phase 2 Completion Summary (Updated)**

### ✅ **Completed Components**
- **Agent Configuration System**: Complete Pydantic schemas with validation
- **AgentFactory Service**: Dynamic Pipecat pipeline generation working
- **Provider Service**: 6 providers integrated with encrypted credential storage
- **FastAPI Application**: Production-ready API with authentication, CORS, WebSocket support
- **API Endpoints**: Full CRUD operations for agents, providers, credentials
- **Agent Templates**: Basic template system with 2 example templates
- **Configuration Testing**: Validation and testing endpoints functional

### ⚠️ **Partially Completed**
- **Provider Registry**: 6/40+ providers implemented (OpenAI, Deepgram, Azure, Anthropic, ElevenLabs, Cartesia)

### ⚠️ **In Progress**
- **Frontend UI Components**: Platform foundation complete with enhanced UI/UX (Phase 1 integration), Provider Marketplace UI needed
- **API Backend**: Structure complete but deployment configuration needs optimization

### ❌ **Not Completed**
- **Database Integration**: Using mock in-memory storage instead of PostgreSQL
- **Deployment Infrastructure**: No container orchestration, load balancing, or scaling
- **Advanced Features**: No versioning, import/export, team features, or analytics

### 📈 **Overall Progress (Updated - September 24, 2025)**
- **Backend Foundation**: 90% Complete (all core services implemented)
- **Frontend Components**: 40% Complete (UI/UX foundation, templates, navigation complete)
- **Integration**: 70% Complete (AI Voicei successfully integrated, voice functionality working)
- **Infrastructure**: 10% Complete (basic health checks only)
- **Total Phase 2**: ~50% Complete

### 🎯 **Ready for Next Steps**
The backend API foundation is solid and ready for frontend integration. Priority should be creating the visual agent builder and provider marketplace UI components.

---

**Document Created:** September 22, 2025
**Last Updated:** September 24, 2025
**Phase Status:** Week 4 - Backend Foundation Complete (90%), Frontend Integration In Progress (40%), Ready for Provider Marketplace UI Implementation
**Next Milestone:** Agent Builder UI Development (Week 5)