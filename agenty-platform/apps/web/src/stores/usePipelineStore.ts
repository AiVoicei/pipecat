import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'

// Pipeline node types
export type PipelineNodeType = 'stt' | 'llm' | 'tts' | 'realtime' | 'filter' | 'aggregator' | 'custom'

// Node data structure
export interface PipelineNodeData {
  label: string
  type: PipelineNodeType
  provider?: string
  configuration?: Record<string, string | number | boolean>
  isConfigured?: boolean
  title?: string
  subtitle?: string
  nodeType?: PipelineNodeType
  status?: 'idle' | 'active' | 'error' | 'processing'
}

// Pipeline node
export interface PipelineNode extends Node {
  data: PipelineNodeData
}

// Pipeline configuration
export interface PipelineConfig {
  id: string
  name: string
  description: string
  nodes: PipelineNode[]
  edges: Edge[]
  isValid: boolean
  createdAt: string
  updatedAt: string
}

// Pipeline template structure
export interface PipelineTemplate {
  id: string
  name: string
  description: string
  type: 'realtime' | 'traditional' | 'enhanced'
  nodes: Partial<PipelineNodeData>[]
  edges: { sourceIndex: number; targetIndex: number }[]
}

interface PipelineStore {
  // Current pipeline state
  nodes: PipelineNode[]
  edges: Edge[]
  selectedNode: PipelineNode | null

  // Pipeline management
  pipelines: PipelineConfig[]
  currentPipeline: PipelineConfig | null
  isLoading: boolean
  error: string | null

  // Actions
  setNodes: (nodes: PipelineNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  // Node management
  addNode: (type: PipelineNodeType, position: { x: number; y: number }) => PipelineNode
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, data: Partial<PipelineNodeData>) => void
  selectNode: (node: PipelineNode | null) => void

  // Pipeline management
  createPipeline: (name: string, description: string) => void
  loadPipeline: (pipelineId: string) => void
  savePipeline: () => void
  deletePipeline: (pipelineId: string) => void
  validatePipeline: () => boolean
  exportPipeline: () => string
  importPipeline: (configJson: string) => void

  // Template management
  loadTemplate: (templateId: string) => void

  // Utility functions
  resetPipeline: () => void
  setError: (error: string | null) => void
}

// Default node templates
const nodeTemplates: Record<PipelineNodeType, Partial<PipelineNodeData>> = {
  stt: {
    label: 'Speech to Text',
    type: 'stt',
    isConfigured: false
  },
  llm: {
    label: 'Language Model',
    type: 'llm',
    isConfigured: false
  },
  tts: {
    label: 'Text to Speech',
    type: 'tts',
    isConfigured: false
  },
  realtime: {
    label: 'Realtime Speech',
    type: 'realtime',
    isConfigured: false
  },
  filter: {
    label: 'Filter',
    type: 'filter',
    isConfigured: false
  },
  aggregator: {
    label: 'Aggregator',
    type: 'aggregator',
    isConfigured: false
  },
  custom: {
    label: 'Custom Function',
    type: 'custom',
    isConfigured: false
  }
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9)

// Valid connection mappings based on Pipecat architecture
const VALID_CONNECTIONS: Record<PipelineNodeType, PipelineNodeType[]> = {
  'stt': ['llm', 'filter', 'aggregator'],        // STT can connect to LLM or helpers
  'llm': ['tts', 'filter', 'aggregator'],        // LLM can connect to TTS or helpers
  'tts': [],                                     // TTS is terminal (end of pipeline)
  'realtime': [],                                // Realtime cannot connect to anything
  'filter': ['llm', 'tts', 'aggregator'],        // Filters can go to processing nodes
  'aggregator': ['llm', 'tts'],                  // Aggregators process data forward
  'custom': ['llm', 'tts', 'filter']             // Custom nodes are flexible
}

interface ConnectionValidation {
  valid: boolean
  error?: string
  warning?: string
}

/**
 * Validates if a connection between two nodes is allowed
 */
export function isValidConnection(
  sourceNode: PipelineNode,
  targetNode: PipelineNode,
  currentNodes: PipelineNode[],
  currentEdges: Edge[]
): ConnectionValidation {
  const sourceType = sourceNode.data.type
  const targetType = targetNode.data.type

  // Rule 1: Prevent same-type connections
  if (sourceType === targetType) {
    return {
      valid: false,
      error: `Cannot connect ${sourceType.toUpperCase()} to ${targetType.toUpperCase()}. Same node types cannot be connected.`
    }
  }

  // Rule 2: Realtime nodes cannot connect to anything
  if (sourceType === 'realtime' || targetType === 'realtime') {
    return {
      valid: false,
      error: 'Realtime nodes work independently and cannot be connected to other nodes.'
    }
  }

  // Rule 3: Check if connection is in valid mappings
  const allowedTargets = VALID_CONNECTIONS[sourceType]
  if (!allowedTargets || !allowedTargets.includes(targetType)) {
    return {
      valid: false,
      error: `${sourceType.toUpperCase()} cannot connect to ${targetType.toUpperCase()}. Valid connections: ${allowedTargets?.join(', ') || 'none'}.`
    }
  }

  // Rule 4: Detect circular dependencies
  if (wouldCreateCycle(sourceNode.id, targetNode.id, currentEdges)) {
    return {
      valid: false,
      error: 'This connection would create a circular dependency.'
    }
  }

  // Rule 5: Prevent duplicate connections
  const existingConnection = currentEdges.find(
    edge => edge.source === sourceNode.id && edge.target === targetNode.id
  )
  if (existingConnection) {
    return {
      valid: false,
      error: 'Connection already exists between these nodes.'
    }
  }

  return { valid: true }
}

/**
 * Detects if adding a connection would create a cycle
 */
function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: Edge[]
): boolean {
  // Build adjacency list
  const graph: Record<string, string[]> = {}
  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = []
    graph[edge.source].push(edge.target)
  })

  // Add the proposed edge
  if (!graph[sourceId]) graph[sourceId] = []
  graph[sourceId].push(targetId)

  // DFS cycle detection
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visited.add(nodeId)
    recStack.add(nodeId)

    const neighbors = graph[nodeId] || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true
    }

    recStack.delete(nodeId)
    return false
  }

  return hasCycle(sourceId)
}

/**
 * Check if edge list contains cycles
 */
function hasCycles(edges: Edge[]): boolean {
  const graph: Record<string, string[]> = {}
  edges.forEach(edge => {
    if (!graph[edge.source]) graph[edge.source] = []
    graph[edge.source].push(edge.target)
  })

  const visited = new Set<string>()
  const recStack = new Set<string>()

  function dfs(node: string): boolean {
    if (recStack.has(node)) return true
    if (visited.has(node)) return false

    visited.add(node)
    recStack.add(node)

    const neighbors = graph[node] || []
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true
    }

    recStack.delete(node)
    return false
  }

  for (const node of Object.keys(graph)) {
    if (dfs(node)) return true
  }

  return false
}

/**
 * Comprehensive pipeline validation result
 */
export interface PipelineValidationResult {
  valid: boolean
  type?: 'realtime' | 'traditional' | 'enhanced'
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Pre-built pipeline templates for quick start
 */
export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime',
    description: 'Speech-to-speech conversation with OpenAI Realtime API',
    type: 'realtime',
    nodes: [
      { type: 'realtime', provider: 'OpenAI Realtime API', label: 'OpenAI Realtime' }
    ],
    edges: []
  },
  {
    id: 'gemini-live',
    name: 'Gemini Multimodal Live',
    description: 'Real-time multimodal conversation with Gemini 2.0',
    type: 'realtime',
    nodes: [
      { type: 'realtime', provider: 'Gemini 2.0 Flash Live API', label: 'Gemini Live' }
    ],
    edges: []
  },
  {
    id: 'openai-cartesia',
    name: 'OpenAI + Cartesia',
    description: 'OpenAI Whisper STT + GPT-4 + Cartesia TTS',
    type: 'traditional',
    nodes: [
      {
        type: 'stt',
        provider: 'OpenAI',
        label: 'Whisper STT',
        configuration: {
          model: 'whisper-1',
          language: 'en'
        }
      },
      {
        type: 'llm',
        provider: 'OpenAI',
        label: 'GPT-4',
        configuration: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a helpful and friendly AI assistant. Provide clear, concise, and accurate responses to user questions.'
        }
      },
      {
        type: 'tts',
        provider: 'Cartesia',
        label: 'Cartesia TTS',
        configuration: {
          voice: 'professional_female',
          speed: 1.0,
          emotion: 'neutral'
        }
      }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 }, // STT → LLM
      { sourceIndex: 1, targetIndex: 2 }  // LLM → TTS
    ]
  },
  {
    id: 'anthropic-elevenlabs',
    name: 'Claude + ElevenLabs',
    description: 'Deepgram STT + Claude + ElevenLabs TTS',
    type: 'traditional',
    nodes: [
      {
        type: 'stt',
        provider: 'Deepgram',
        label: 'Deepgram STT',
        configuration: {
          model: 'nova-2',
          language: 'en'
        }
      },
      {
        type: 'llm',
        provider: 'Anthropic',
        label: 'Claude 3.5 Sonnet',
        configuration: {
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Provide thoughtful and detailed responses while being conversational and engaging.'
        }
      },
      {
        type: 'tts',
        provider: 'ElevenLabs',
        label: 'ElevenLabs TTS',
        configuration: {
          voice: 'Rachel',
          stability: 0.75,
          similarity: 0.75
        }
      }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 }
    ]
  },
  {
    id: 'google-anthropic-azure',
    name: 'Best of Breed',
    description: 'Google Cloud STT + Anthropic Claude + Azure TTS',
    type: 'traditional',
    nodes: [
      {
        type: 'stt',
        provider: 'Google Cloud',
        label: 'Google STT',
        configuration: {
          model: 'latest',
          language: 'en-US',
          enableAutomaticPunctuation: true
        }
      },
      {
        type: 'llm',
        provider: 'Anthropic',
        label: 'Claude 3.5 Sonnet',
        configuration: {
          model: 'claude-3-sonnet',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest. Provide thoughtful and detailed responses while being conversational and engaging.'
        }
      },
      {
        type: 'tts',
        provider: 'Azure Cognitive Services',
        label: 'Azure TTS',
        configuration: {
          voice: 'en-US-JennyNeural',
          rate: 'medium',
          pitch: 'medium'
        }
      }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 }
    ]
  },
  {
    id: 'enhanced-filters',
    name: 'Pipeline with Filters',
    description: 'STT with wake word + LLM + content filter + TTS',
    type: 'enhanced',
    nodes: [
      { type: 'stt', provider: 'deepgram', label: 'Deepgram STT' },
      { type: 'filter', label: 'Wake Word Filter' },
      { type: 'llm', provider: 'openai', label: 'GPT-4' },
      { type: 'filter', label: 'Content Filter' },
      { type: 'tts', provider: 'cartesia', label: 'Cartesia TTS' }
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 }, // STT → Wake Filter
      { sourceIndex: 1, targetIndex: 2 }, // Wake Filter → LLM
      { sourceIndex: 2, targetIndex: 3 }, // LLM → Content Filter
      { sourceIndex: 3, targetIndex: 4 }  // Content Filter → TTS
    ]
  }
]

/**
 * Validates complete pipeline with detailed errors, warnings, and suggestions
 */
export function validatePipelineDetailed(
  nodes: PipelineNode[],
  edges: Edge[]
): PipelineValidationResult {
  const result: PipelineValidationResult = {
    valid: false,
    errors: [],
    warnings: [],
    suggestions: []
  }

  // Case 0: Empty pipeline
  if (nodes.length === 0) {
    result.errors.push('Pipeline is empty. Add nodes to get started.')
    result.suggestions.push('Start by dragging an STT node onto the canvas or use a Quick Start template')
    return result
  }

  // Categorize nodes
  const realtimeNodes = nodes.filter(n => n.data.type === 'realtime')
  const sttNodes = nodes.filter(n => n.data.type === 'stt')
  const llmNodes = nodes.filter(n => n.data.type === 'llm')
  const ttsNodes = nodes.filter(n => n.data.type === 'tts')
  const filterNodes = nodes.filter(n => n.data.type === 'filter')
  const aggregatorNodes = nodes.filter(n => n.data.type === 'aggregator')

  // CASE 1: REALTIME PIPELINE
  if (realtimeNodes.length > 0) {
    result.type = 'realtime'

    // Multiple realtime nodes
    if (realtimeNodes.length > 1) {
      result.errors.push(`Only one realtime node allowed. Found ${realtimeNodes.length}.`)
      result.suggestions.push('Remove extra realtime nodes - only one is needed')
    }

    // Realtime with other core nodes
    if (sttNodes.length > 0 || llmNodes.length > 0 || ttsNodes.length > 0) {
      result.errors.push('Realtime pipelines cannot include STT, LLM, or TTS nodes.')
      result.suggestions.push('Remove all STT/LLM/TTS nodes when using realtime mode')
      result.warnings.push('Realtime providers handle speech processing internally')
    }

    // Realtime with connections
    if (edges.length > 0) {
      result.errors.push('Realtime nodes cannot be connected to other nodes.')
      result.suggestions.push('Remove all connections from the realtime node')
    }

    // Check configuration
    const realtimeNode = realtimeNodes[0]
    if (!realtimeNode.data.isConfigured) {
      result.errors.push('Realtime node requires configuration.')
      result.suggestions.push('Click the realtime node to configure provider and credentials')
    }

    result.valid = result.errors.length === 0
    return result
  }

  // CASE 2: TRADITIONAL PIPELINE
  result.type = sttNodes.length > 0 && llmNodes.length > 0 && ttsNodes.length > 0
    ? 'traditional'
    : 'enhanced'

  // Check for required core nodes
  if (sttNodes.length === 0) {
    result.errors.push('Missing STT (Speech-to-Text) node.')
    result.suggestions.push('Add an STT node to process user speech')
  } else if (sttNodes.length > 1) {
    result.warnings.push(`Found ${sttNodes.length} STT nodes. Only the first one will be used.`)
    result.suggestions.push('Consider removing duplicate STT nodes')
  }

  if (llmNodes.length === 0) {
    result.errors.push('Missing LLM (Language Model) node.')
    result.suggestions.push('Add an LLM node to process conversations')
  } else if (llmNodes.length > 1) {
    result.warnings.push(`Found ${llmNodes.length} LLM nodes. Only the first one will be used.`)
    result.suggestions.push('Consider removing duplicate LLM nodes')
  }

  if (ttsNodes.length === 0) {
    result.errors.push('Missing TTS (Text-to-Speech) node.')
    result.suggestions.push('Add a TTS node to generate voice responses')
  } else if (ttsNodes.length > 1) {
    result.warnings.push(`Found ${ttsNodes.length} TTS nodes. Only the first one will be used.`)
    result.suggestions.push('Consider removing duplicate TTS nodes')
  }

  // Check connectivity
  if (nodes.length > 1 && edges.length === 0) {
    result.errors.push('Nodes are not connected.')
    result.suggestions.push('Connect nodes in sequence: STT → LLM → TTS')
  }

  // Check for required path STT → LLM → TTS
  if (sttNodes.length > 0 && llmNodes.length > 0 && ttsNodes.length > 0) {
    const hasSTTtoLLM = edges.some(e =>
      sttNodes.some(stt => stt.id === e.source) &&
      llmNodes.some(llm => llm.id === e.target)
    )
    const hasLLMtoTTS = edges.some(e =>
      llmNodes.some(llm => llm.id === e.source) &&
      ttsNodes.some(tts => tts.id === e.target)
    )

    if (!hasSTTtoLLM) {
      result.errors.push('STT node must connect to LLM node.')
      result.suggestions.push('Draw a connection from STT to LLM')
    }

    if (!hasLLMtoTTS) {
      result.errors.push('LLM node must connect to TTS node.')
      result.suggestions.push('Draw a connection from LLM to TTS')
    }
  }

  // Check for isolated nodes
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  const isolatedNodes = nodes.filter(n => !connectedNodeIds.has(n.id))
  if (isolatedNodes.length > 0) {
    result.warnings.push(`${isolatedNodes.length} node(s) are not connected to the pipeline.`)
    result.suggestions.push('Connect or remove isolated nodes')
  }

  // Check node configurations - CRITICAL FOR CORE NODES
  const unconfiguredCoreNodes = nodes.filter(n =>
    !n.data.isConfigured &&
    ['stt', 'llm', 'tts', 'realtime'].includes(n.data.type)
  )
  const unconfiguredHelperNodes = nodes.filter(n =>
    !n.data.isConfigured &&
    ['filter', 'aggregator', 'custom'].includes(n.data.type)
  )

  if (unconfiguredCoreNodes.length > 0) {
    result.errors.push(`${unconfiguredCoreNodes.length} core node(s) require configuration before deployment.`)
    result.suggestions.push('Click each unconfigured node to select a provider and configure settings')
  }

  if (unconfiguredHelperNodes.length > 0) {
    result.warnings.push(`${unconfiguredHelperNodes.length} helper node(s) need configuration.`)
    result.suggestions.push('Configure filter/aggregator nodes for optimal performance')
  }

  // Check for cycles
  if (hasCycles(edges)) {
    result.errors.push('Pipeline contains circular connections.')
    result.suggestions.push('Remove connections that create loops')
  }

  // Add helpful tips for filters and aggregators
  if (filterNodes.length > 0) {
    result.warnings.push(`Pipeline includes ${filterNodes.length} filter(s). Ensure they are in the correct position.`)
  }

  if (aggregatorNodes.length > 0) {
    result.warnings.push(`Pipeline includes ${aggregatorNodes.length} aggregator(s). Verify configuration.`)
  }

  result.valid = result.errors.length === 0

  return result
}

export const usePipelineStore = create<PipelineStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNode: null,
      pipelines: [],
      currentPipeline: null,
      isLoading: false,
      error: null,

      // Node and edge management
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes)
        })
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges)
        })
      },

      onConnect: (connection) => {
        console.log('🔗 onConnect called with:', connection)

        const sourceNode = get().nodes.find(n => n.id === connection.source)
        const targetNode = get().nodes.find(n => n.id === connection.target)

        console.log('🔍 Source node:', sourceNode)
        console.log('🔍 Target node:', targetNode)

        if (!sourceNode || !targetNode) {
          console.error('❌ Nodes not found!')
          set({ error: 'Invalid connection: nodes not found' })
          return
        }

        // Validate connection
        console.log('🔍 Validating connection...')
        const validation = isValidConnection(
          sourceNode,
          targetNode,
          get().nodes,
          get().edges
        )

        console.log('📊 Validation result:', validation)

        if (!validation.valid) {
          // Show error to user (will be handled by toast notification)
          console.error('❌ Invalid connection:', validation.error)
          // Set error with timestamp to ensure unique value triggers useEffect
          set({ error: `${validation.error}|${Date.now()}` })
          return
        }

        // Connection is valid - create edge
        const newEdge = {
          id: `${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'turbo',
          animated: true,
          style: { stroke: '#8B5CF6', strokeWidth: 2 }
        }

        console.log('✅ Valid connection created:', newEdge)

        set({
          edges: [...get().edges, newEdge],
          error: null // Clear any previous errors
        })
      },

      // Node management
      addNode: (type, position) => {
        const nodeCount = get().nodes.filter(n => n.data.type === type).length + 1
        const newNode: PipelineNode = {
          id: generateId(),
          type: 'turbo',
          position,
          data: {
            ...nodeTemplates[type],
            title: `${nodeTemplates[type].label} ${nodeCount}`,
            subtitle: `${type.toUpperCase()} Provider`,
            nodeType: type,
            status: 'idle' as const
          }
        }

        set({
          nodes: [...get().nodes, newNode]
        })

        console.log('Added node:', newNode) // Debug log

        return newNode
      },

      removeNode: (nodeId) => {
        set({
          nodes: get().nodes.filter(node => node.id !== nodeId),
          edges: get().edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
          selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode
        })
      },

      updateNode: (nodeId, data) => {
        set({
          nodes: get().nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          )
        })
      },

      selectNode: (node) => set({ selectedNode: node }),

      // Pipeline management
      createPipeline: (name, description) => {
        const newPipeline: PipelineConfig = {
          id: generateId(),
          name,
          description,
          nodes: [],
          edges: [],
          isValid: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        set({
          pipelines: [...get().pipelines, newPipeline],
          currentPipeline: newPipeline,
          nodes: [],
          edges: [],
          selectedNode: null
        })
      },

      loadPipeline: (pipelineId) => {
        const pipeline = get().pipelines.find(p => p.id === pipelineId)
        if (pipeline) {
          set({
            currentPipeline: pipeline,
            nodes: pipeline.nodes,
            edges: pipeline.edges,
            selectedNode: null
          })
        }
      },

      savePipeline: () => {
        const { currentPipeline, nodes, edges } = get()
        if (currentPipeline) {
          const updatedPipeline = {
            ...currentPipeline,
            nodes,
            edges,
            isValid: get().validatePipeline(),
            updatedAt: new Date().toISOString()
          }

          set({
            pipelines: get().pipelines.map(p =>
              p.id === currentPipeline.id ? updatedPipeline : p
            ),
            currentPipeline: updatedPipeline
          })
        }
      },

      deletePipeline: (pipelineId) => {
        set({
          pipelines: get().pipelines.filter(p => p.id !== pipelineId),
          currentPipeline: get().currentPipeline?.id === pipelineId ? null : get().currentPipeline
        })
      },

      validatePipeline: () => {
        const { nodes, edges } = get()

        // Basic validation rules
        if (nodes.length === 0) return false

        const nodeTypes = nodes.map(n => n.data.type)
        const hasRealtime = nodeTypes.includes('realtime')

        if (hasRealtime) {
          // For realtime pipelines, we just need the realtime node
          return nodes.length >= 1
        } else {
          // Check for required node types (at least STT, LLM, TTS)
          const hasSTT = nodeTypes.includes('stt')
          const hasLLM = nodeTypes.includes('llm')
          const hasTTS = nodeTypes.includes('tts')

          if (!hasSTT || !hasLLM || !hasTTS) return false

          // Check for proper connections (simplified)
          if (nodes.length > 1 && edges.length === 0) return false
        }

        return true
      },

      exportPipeline: () => {
        const { currentPipeline, nodes, edges } = get()
        return JSON.stringify({
          pipeline: currentPipeline,
          nodes,
          edges
        }, null, 2)
      },

      importPipeline: (configJson) => {
        try {
          const config = JSON.parse(configJson)
          if (config.pipeline && config.nodes && config.edges) {
            set({
              currentPipeline: config.pipeline,
              nodes: config.nodes,
              edges: config.edges,
              selectedNode: null
            })
          }
        } catch (error) {
          set({ error: 'Invalid pipeline configuration' })
        }
      },

      // Template management
      loadTemplate: (templateId) => {
        const template = PIPELINE_TEMPLATES.find(t => t.id === templateId)
        if (!template) {
          set({ error: 'Template not found' })
          return
        }

        // Clear existing pipeline
        set({ nodes: [], edges: [], selectedNode: null })

        // Create nodes with proper positioning
        const createdNodes: PipelineNode[] = []
        template.nodes.forEach((nodeData, index) => {
          const position = {
            x: 100 + (index * 280), // 280px spacing for Turbo Flow
            y: 200
          }

          const nodeId = generateId()
          const newNode: PipelineNode = {
            id: nodeId,
            type: 'turbo',
            position,
            data: {
              ...nodeTemplates[nodeData.type!],
              ...nodeData,
              title: nodeData.label || nodeTemplates[nodeData.type!].label,
              nodeType: nodeData.type,
              // Templates have providers pre-configured but still need API keys
              // User must save the node after ensuring API keys are set
              isConfigured: false
            }
          }

          createdNodes.push(newNode)
        })

        // Set nodes first
        set({ nodes: createdNodes })

        // Create edges after nodes are set (with small delay for ReactFlow)
        setTimeout(() => {
          const newEdges = template.edges.map(({ sourceIndex, targetIndex }) => ({
            id: `${createdNodes[sourceIndex].id}-${createdNodes[targetIndex].id}`,
            source: createdNodes[sourceIndex].id,
            target: createdNodes[targetIndex].id,
            type: 'turbo',
            animated: true,
            style: { stroke: '#8B5CF6', strokeWidth: 2 }
          }))

          set({ edges: newEdges })
        }, 100)
      },

      // Utility functions
      resetPipeline: () => {
        set({
          nodes: [],
          edges: [],
          selectedNode: null,
          currentPipeline: null
        })
      },

      setError: (error) => set({ error })
    }),
    {
      name: 'pipeline-store'
    }
  )
)